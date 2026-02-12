/**
 * Build a local SQLite clue database from the eigenfoo/cryptics dataset.
 *
 * Creates `scripts/data/clues-local.db` with:
 *   - clue_types table (9 rows matching our app schema)
 *   - clues table (columns matching the Supabase schema)
 *   - FTS5 virtual table on clue_text for full-text search
 *
 * Reuses the existing eigenfoo-reader + transformers pipeline.
 *
 * Usage:
 *   npx tsx scripts/build-local-db.ts
 *   npx tsx scripts/build-local-db.ts --limit 500
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { readEigenfooClues } from './lib/eigenfoo-reader.js';
import { transformRow } from './lib/transformers.js';
import { cleanAnnotations, normalizeCacheKeys } from './lib/annotation-cleaner.js';
import type { AnnotationCache } from './lib/annotation-cleaner.js';
import type { TransformedClue } from './lib/types.js';

// ── Paths ──

const scriptDir = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
);
const OUTPUT_PATH = path.join(scriptDir, 'data', 'clues-local.db');
const ANNOTATIONS_PATH = path.join(scriptDir, 'data', 'annotations.json');

// ── CLI args ──

const args = process.argv.slice(2);
function getOption(name: string, defaultValue: number): number {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return defaultValue;
  const val = parseInt(args[idx + 1], 10);
  return isNaN(val) ? defaultValue : val;
}

const TOTAL_LIMIT = getOption('limit', 2000);
const LIMIT_PER_TYPE = Math.ceil(TOTAL_LIMIT / 8);

// ── Clue type definitions (matching our app's 9 types) ──

const CLUE_TYPES = [
  { slug: 'anagram', name: 'Anagram' },
  { slug: 'hidden-word', name: 'Hidden Word' },
  { slug: 'double-definition', name: 'Double Definition' },
  { slug: 'charade', name: 'Charade' },
  { slug: 'container', name: 'Container' },
  { slug: 'reversal', name: 'Reversal' },
  { slug: 'homophone', name: 'Homophone' },
  { slug: 'deletion', name: 'Deletion' },
  { slug: 'cryptic-definition', name: 'Cryptic Definition' },
] as const;

// ── Main ──

function main() {
  console.log(`\nBuilding local clue database...`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Target: ~${TOTAL_LIMIT} clues (~${LIMIT_PER_TYPE} per type)\n`);

  // Remove existing DB if present
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.unlinkSync(OUTPUT_PATH);
    console.log('Removed existing clues-local.db');
  }

  // 1. Read and transform clues from eigenfoo
  console.log('Reading eigenfoo database...');
  const rawRows = readEigenfooClues(LIMIT_PER_TYPE);
  console.log(`Read ${rawRows.length} raw rows\n`);

  console.log('Transforming clues...');
  const transformed: TransformedClue[] = [];
  let failures = 0;

  for (const row of rawRows) {
    const result = transformRow(row);
    if (result.error) {
      failures++;
      continue;
    }
    transformed.push(result.clue!);
  }

  // Deduplicate by clue_text
  const seen = new Set<string>();
  const unique: TransformedClue[] = [];
  for (const clue of transformed) {
    const key = clue.clue_text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clue);
  }

  const toInsert = unique.slice(0, TOTAL_LIMIT);
  console.log(`Transformed: ${transformed.length} valid, ${failures} failures`);
  console.log(`After dedup: ${unique.length} unique, inserting ${toInsert.length}\n`);

  // 1b. Apply scraped annotations from cache (if available)
  let annotationsApplied = 0;
  let annotationsDiscarded = 0;
  if (fs.existsSync(ANNOTATIONS_PATH)) {
    console.log('Loading scraped annotations cache...');
    let cache: AnnotationCache = JSON.parse(fs.readFileSync(ANNOTATIONS_PATH, 'utf-8'));
    const cacheSize = Object.keys(cache).length;
    console.log(`Loaded ${cacheSize} cached annotations`);

    // Normalize cache keys to plain ASCII (smart quotes → straight, etc.)
    const { normalized, keysRenamed } = normalizeCacheKeys(cache);
    cache = normalized;
    if (keysRenamed > 0) {
      console.log(`Normalized ${keysRenamed} cache keys to plain ASCII`);
    }

    // Clean any uncleaned entries and persist results
    const cleanStats = cleanAnnotations(cache);
    const cacheChanged = keysRenamed > 0 || cleanStats.fixed > 0 || cleanStats.discarded > 0;
    if (cleanStats.fixed > 0 || cleanStats.discarded > 0) {
      console.log(`Cleaned ${cleanStats.fixed + cleanStats.discarded} new entries: ${cleanStats.fixed} fixed, ${cleanStats.discarded} discarded`);
      if (Object.keys(cleanStats.discardReasons).length > 0) {
        for (const [reason, count] of Object.entries(cleanStats.discardReasons)) {
          console.log(`  ${reason}: ${count}`);
        }
      }
    } else if (cleanStats.alreadyClean > 0) {
      console.log(`All ${cleanStats.alreadyClean} entries already cleaned`);
    }
    // Persist if anything changed (key normalization or cleaning)
    if (cacheChanged) {
      fs.writeFileSync(ANNOTATIONS_PATH, JSON.stringify(cache, null, 2));
      console.log('Updated annotations cache');
    }

    // Apply non-discarded annotations to clues
    for (const clue of toInsert) {
      const key = clue.clue_text.toLowerCase();
      const cached = cache[key];
      if (cached && cached.annotation && !cached.discarded) {
        clue.annotation = cached.annotation;
        clue.wordplay_part = cached.annotation;
        annotationsApplied++;
      } else if (cached?.discarded) {
        annotationsDiscarded++;
      }
    }

    console.log(`Applied ${annotationsApplied} scraped annotations (skipped ${annotationsDiscarded} discarded)\n`);
  } else {
    console.log('No annotations cache found (run scrape-annotations.ts first to improve quality)\n');
  }

  // 2. Create SQLite database
  const db = new Database(OUTPUT_PATH);
  db.pragma('journal_mode = WAL');

  // Create clue_types table
  db.exec(`
    CREATE TABLE clue_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    )
  `);

  const insertType = db.prepare(
    'INSERT INTO clue_types (slug, name) VALUES (?, ?)'
  );

  const typeMap = new Map<string, number>();

  const insertTypes = db.transaction(() => {
    for (const ct of CLUE_TYPES) {
      const info = insertType.run(ct.slug, ct.name);
      typeMap.set(ct.slug, Number(info.lastInsertRowid));
    }
  });
  insertTypes();
  console.log(`Inserted ${CLUE_TYPES.length} clue types`);

  // Create clues table
  db.exec(`
    CREATE TABLE clues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clue_text TEXT NOT NULL,
      answer TEXT NOT NULL,
      letter_pattern TEXT NOT NULL,
      clue_type_id INTEGER NOT NULL REFERENCES clue_types(id),
      annotation TEXT NOT NULL DEFAULT '',
      definition_part TEXT NOT NULL DEFAULT '',
      wordplay_part TEXT NOT NULL DEFAULT '',
      difficulty INTEGER NOT NULL DEFAULT 1,
      source TEXT,
      is_verified INTEGER NOT NULL DEFAULT 1
    )
  `);

  // Create FTS5 virtual table for full-text search on clue_text
  db.exec(`
    CREATE VIRTUAL TABLE clues_fts USING fts5(
      clue_text,
      content='clues',
      content_rowid='id'
    )
  `);

  // Insert clues
  const insertClue = db.prepare(`
    INSERT INTO clues (clue_text, answer, letter_pattern, clue_type_id, annotation, definition_part, wordplay_part, difficulty, source, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFts = db.prepare(`
    INSERT INTO clues_fts (rowid, clue_text) VALUES (?, ?)
  `);

  let inserted = 0;

  const insertAll = db.transaction(() => {
    for (const clue of toInsert) {
      const clueTypeId = typeMap.get(clue.clue_type_slug);
      if (!clueTypeId) continue;

      const info = insertClue.run(
        clue.clue_text,
        clue.answer,
        clue.letter_pattern,
        clueTypeId,
        clue.annotation,
        clue.definition_part,
        clue.wordplay_part,
        clue.difficulty,
        clue.source,
        clue.is_verified ? 1 : 0
      );

      insertFts.run(Number(info.lastInsertRowid), clue.clue_text);
      inserted++;
    }
  });
  insertAll();

  // Create index on answer for fast lookups
  db.exec('CREATE INDEX idx_clues_answer ON clues(answer)');

  db.close();

  // Report stats
  const stats = fs.statSync(OUTPUT_PATH);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

  console.log(`\nInserted ${inserted} clues`);
  console.log(`Database size: ${sizeMB} MB`);

  // Type distribution
  const typeCounts = new Map<string, number>();
  for (const clue of toInsert) {
    typeCounts.set(
      clue.clue_type_slug,
      (typeCounts.get(clue.clue_type_slug) ?? 0) + 1
    );
  }
  console.log('\nType distribution:');
  for (const [type, count] of [...typeCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${type}: ${count}`);
  }

  console.log(`\nDone! Local database ready at ${OUTPUT_PATH}\n`);
}

main();
