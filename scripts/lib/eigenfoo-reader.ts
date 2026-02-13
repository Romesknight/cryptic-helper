/**
 * Reads the eigenfoo/cryptics SQLite database and returns typed rows
 * with full indicator word data from all wordplay type columns.
 *
 * The indicators_by_clue table has one column per indicator type
 * (anagram, hidden, reversal, etc.), each containing the indicator word
 * when present or an empty string when not.
 *
 * Expects the database at scripts/data/cryptics.db.
 * Download: curl -o scripts/data/cryptics.db https://cryptics.georgeho.org/data.db
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { EigenfooRawRow, EigenfooIndicatorType } from './types.js';
import { INDICATOR_COLUMNS } from './types.js';

const DB_PATH = path.join(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')),
  '..',
  'data',
  'cryptics.db'
);

/**
 * Read clues from the eigenfoo SQLite database, joined with all indicator columns.
 *
 * For each indicator type, queries clues where that indicator column is non-empty,
 * limited to the most recent puzzles. All indicator columns are returned so the
 * transformer can build rich annotations using the actual indicator words.
 *
 * @param limitPerType - Maximum clues to fetch per indicator type (default 300).
 * @returns Array of raw rows with all indicator columns populated.
 */
export function readEigenfooClues(limitPerType = 300): EigenfooRawRow[] {
  const dbPath = DB_PATH.startsWith('/') && process.platform === 'win32'
    ? DB_PATH.slice(1)
    : DB_PATH;

  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at: ${dbPath}`);
    console.error(
      'Download it first:\n  curl -o scripts/data/cryptics.db https://cryptics.georgeho.org/data.db'
    );
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: true });

  const allRows: EigenfooRawRow[] = [];
  const seenRowids = new Set<string>();
  const ALLOWED_COLUMNS = new Set(INDICATOR_COLUMNS);

  for (const col of INDICATOR_COLUMNS) {
    if (!ALLOWED_COLUMNS.has(col)) {
      throw new Error(`Invalid indicator column: ${col}`);
    }
    const stmt = db.prepare(`
      SELECT
        c.clue,
        c.answer,
        c.definition,
        c.clue_number,
        c.puzzle_date,
        c.puzzle_name,
        c.source_url,
        c.source,
        ibc.anagram,
        ibc.hidden,
        ibc.reversal,
        ibc.container,
        ibc.insertion,
        ibc.homophone,
        ibc.deletion,
        ibc.alternation
      FROM clues c
      INNER JOIN indicators_by_clue ibc
        ON c.rowid = ibc.clue_rowid
      WHERE ibc.${col} IS NOT NULL
        AND ibc.${col} != ''
        AND c.definition IS NOT NULL
        AND c.definition != ''
        AND c.answer IS NOT NULL
        AND c.answer != ''
      ORDER BY c.puzzle_date DESC
      LIMIT ?
    `);

    const rows = stmt.all(limitPerType) as EigenfooRawRow[];

    for (const row of rows) {
      // Deduplicate across types: a clue with both anagram + insertion
      // indicators gets imported once under the first type we encounter
      const key = `${row.clue}|${row.answer}`;
      if (!seenRowids.has(key)) {
        seenRowids.add(key);
        allRows.push(row);
      }
    }
  }

  db.close();

  return allRows;
}
