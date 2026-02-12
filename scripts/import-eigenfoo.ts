/**
 * Import clues from the eigenfoo/cryptics dataset into Supabase.
 *
 * Usage:
 *   npx tsx scripts/import-eigenfoo.ts                  # Import ~2000 clues
 *   npx tsx scripts/import-eigenfoo.ts --limit 500      # Custom total limit
 *   npx tsx scripts/import-eigenfoo.ts --dry-run        # Preview without writing
 *   npx tsx scripts/import-eigenfoo.ts --verbose        # Show each clue processed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 *
 * Pre-requisite: download the eigenfoo database:
 *   curl -o scripts/data/cryptics.db https://cryptics.georgeho.org/data.db
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { readEigenfooClues } from './lib/eigenfoo-reader.js';
import { transformRow } from './lib/transformers.js';
import type { TransformedClue } from './lib/types.js';

// ── Load .env.local (Next.js doesn't load it for standalone scripts) ──

const envPath = path.join(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')),
  '..',
  '.env.local'
);
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// ── CLI Argument Parsing ──

const args = process.argv.slice(2);

function getFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function getOption(name: string, defaultValue: number): number {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return defaultValue;
  const val = parseInt(args[idx + 1], 10);
  return isNaN(val) ? defaultValue : val;
}

const DRY_RUN = getFlag('dry-run');
const VERBOSE = getFlag('verbose');
const TOTAL_LIMIT = getOption('limit', 2000);

// Number of indicator types we import
const NUM_TYPES = 8;
const LIMIT_PER_TYPE = Math.ceil(TOTAL_LIMIT / NUM_TYPES);
const BATCH_SIZE = 50;

// ── Supabase Setup (deferred — only created when actually needed) ──

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      'Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.\n' +
      'Use --dry-run to preview without database access.'
    );
    process.exit(1);
  }

  return createClient(url, key);
}

// ── Main ──

async function main() {
  console.log(`\nEigenfoo Import${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log(`Target: ~${TOTAL_LIMIT} clues (~${LIMIT_PER_TYPE} per type)\n`);

  // 1. Read raw rows from SQLite
  console.log('Reading eigenfoo database...');
  const rawRows = readEigenfooClues(LIMIT_PER_TYPE);
  console.log(`Read ${rawRows.length} raw rows from SQLite\n`);

  // 2. Transform rows
  const transformed: TransformedClue[] = [];
  let validationFailures = 0;

  for (const row of rawRows) {
    const result = transformRow(row);
    if (result.error) {
      validationFailures++;
      if (VERBOSE) {
        console.log(`  SKIP: ${result.error}`);
      }
      continue;
    }
    transformed.push(result.clue!);
  }

  console.log(`Transformed: ${transformed.length} valid, ${validationFailures} validation failures`);

  // Deduplicate by clue_text (keep first occurrence)
  const seen = new Set<string>();
  const unique: TransformedClue[] = [];
  for (const clue of transformed) {
    const key = clue.clue_text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clue);
  }

  const deduped = transformed.length - unique.length;
  if (deduped > 0) {
    console.log(`Deduplicated: removed ${deduped} duplicates, ${unique.length} unique clues\n`);
  } else {
    console.log('');
  }

  // Apply total limit
  const toInsert = unique.slice(0, TOTAL_LIMIT);

  if (DRY_RUN) {
    // Dry run: show sample and stats
    console.log('--- Sample Transformed Clues ---');
    for (const clue of toInsert.slice(0, 10)) {
      console.log(`  ${clue.answer} (${clue.clue_type_slug}) [${clue.letter_pattern}] d=${clue.difficulty}`);
      console.log(`    Clue:      "${clue.clue_text}"`);
      console.log(`    Def:       "${clue.definition_part}"`);
      console.log(`    Wordplay:  ${clue.wordplay_part}`);
      console.log(`    Annotation: ${clue.annotation}`);
      console.log(`    Src:       ${clue.source}`);
      console.log('');
    }

    // Type distribution
    const typeCounts = new Map<string, number>();
    for (const clue of toInsert) {
      typeCounts.set(clue.clue_type_slug, (typeCounts.get(clue.clue_type_slug) ?? 0) + 1);
    }
    console.log('--- Type Distribution ---');
    for (const [type, count] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }
    console.log(`\nTotal: ${toInsert.length} clues ready for import`);
    console.log('Run without --dry-run to insert into Supabase.\n');
    return;
  }

  // 3. Fetch clue_type IDs from Supabase
  const supabase = getSupabaseClient();
  console.log('Fetching clue type IDs from Supabase...');
  const { data: clueTypes, error: typeError } = await supabase
    .from('clue_types')
    .select('id, slug');

  if (typeError) {
    console.error('Error fetching clue types:', typeError);
    process.exit(1);
  }

  const typeMap = new Map(
    (clueTypes ?? []).map((t: { id: string; slug: string }) => [t.slug, t.id])
  );

  // 4. Batch upsert into Supabase
  let inserted = 0;
  let duplicates = 0;
  let failed = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    const rows = batch
      .map((clue) => {
        const clueTypeId = typeMap.get(clue.clue_type_slug);
        if (!clueTypeId) {
          if (VERBOSE) {
            console.log(`  SKIP: Unknown clue type "${clue.clue_type_slug}" for ${clue.answer}`);
          }
          failed++;
          return null;
        }
        return {
          id: crypto.randomUUID(),
          clue_text: clue.clue_text,
          answer: clue.answer,
          letter_pattern: clue.letter_pattern,
          clue_type_id: clueTypeId,
          annotation: clue.annotation,
          definition_part: clue.definition_part,
          wordplay_part: clue.wordplay_part,
          difficulty: clue.difficulty,
          source: clue.source,
          is_verified: clue.is_verified,
        };
      })
      .filter(Boolean);

    if (rows.length === 0) continue;

    const { error, count } = await supabase
      .from('clues')
      .upsert(rows, { onConflict: 'clue_text', count: 'exact' });

    if (error) {
      console.error(`  Batch error at ${i}: ${error.message}`);
      failed += rows.length;
    } else {
      const batchInserted = count ?? rows.length;
      inserted += batchInserted;
      duplicates += rows.length - batchInserted;

      if (VERBOSE) {
        for (const clue of batch) {
          console.log(
            `  [${inserted}/${toInsert.length}] ${clue.answer} (${clue.clue_type_slug}) from ${clue.source}`
          );
        }
      } else {
        process.stdout.write(
          `\r  Progress: ${Math.min(i + BATCH_SIZE, toInsert.length)}/${toInsert.length}`
        );
      }
    }
  }

  if (!VERBOSE) {
    process.stdout.write('\n');
  }

  console.log(
    `\nDone: ${inserted} inserted, ${duplicates} skipped (duplicate), ${failed} failed (validation)\n`
  );
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
