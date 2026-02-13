import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeText } from '@/lib/utils';
import path from 'path';

interface DatabaseResult {
  answer: string;
  clueType: string;
  clueTypeLabel: string;
  annotation: string;
  definition: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'database';
}

/**
 * Check whether a real Supabase URL is configured.
 * Returns false for missing or placeholder values.
 */
function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !url.startsWith('YOUR_') && !!key && !key.startsWith('YOUR_');
}

// ── Local SQLite fallback ──

const LOCAL_DB_PATH = path.join(
  process.cwd(),
  'scripts',
  'data',
  'clues-local.db'
);

/** Cached better-sqlite3 Database instance (lazy-loaded, read-only). */
let localDb: import('better-sqlite3').Database | null = null;

/**
 * Get or create the cached local SQLite connection.
 * Returns null if the DB file doesn't exist or better-sqlite3 isn't available.
 */
function getLocalDb(): import('better-sqlite3').Database | null {
  if (localDb) return localDb;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3') as typeof import('better-sqlite3');
    const fs = require('fs') as typeof import('fs');

    if (!fs.existsSync(LOCAL_DB_PATH)) return null;

    localDb = new Database(LOCAL_DB_PATH, { readonly: true });
    return localDb;
  } catch {
    return null;
  }
}

/**
 * Search the local SQLite clue database.
 * Uses FTS5 full-text search first, falls back to LIKE.
 */
function searchLocalDatabase(
  clueText: string,
  letterPattern?: string
): DatabaseResult[] {
  const db = getLocalDb();
  if (!db) return [];

  const cleanClue = normalizeText(clueText.replace(/\(\d+(?:,\d+)*\)\s*$/, '').trim());

  // Build optional letter_pattern filter
  let patternFilter = '';
  const params: (string | number)[] = [];

  if (letterPattern) {
    const pattern = letterPattern.replace(/[^0-9,]/g, '');
    if (pattern) {
      patternFilter = 'AND c.letter_pattern = ?';
      params.push(pattern);
    }
  }

  // Try FTS5 full-text search first
  try {
    const ftsRows = db
      .prepare(
        `
        SELECT c.answer, c.annotation, c.definition_part, c.is_verified,
               ct.slug AS clue_type_slug, ct.name AS clue_type_name
        FROM clues_fts fts
        JOIN clues c ON c.id = fts.rowid
        JOIN clue_types ct ON ct.id = c.clue_type_id
        WHERE clues_fts MATCH ?
          ${patternFilter}
        LIMIT 5
        `
      )
      .all(cleanClue, ...params) as LocalRow[];

    if (ftsRows.length > 0) {
      return mapLocalResults(ftsRows);
    }
  } catch (err) {
    // FTS query failed (e.g. special characters) — fall through to LIKE
    if (process.env.NODE_ENV === 'development') {
      console.error('[solver] FTS search failed:', err);
    }
  }

  // Fallback: LIKE search
  try {
    const likeRows = db
      .prepare(
        `
        SELECT c.answer, c.annotation, c.definition_part, c.is_verified,
               ct.slug AS clue_type_slug, ct.name AS clue_type_name
        FROM clues c
        JOIN clue_types ct ON ct.id = c.clue_type_id
        WHERE c.clue_text LIKE ?
          ${patternFilter}
        LIMIT 5
        `
      )
      .all(`%${cleanClue}%`, ...params) as LocalRow[];

    return mapLocalResults(likeRows);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[solver] LIKE search failed:', err);
    }
    return [];
  }
}

interface LocalRow {
  answer: string;
  annotation: string;
  definition_part: string;
  is_verified: number;
  clue_type_slug: string;
  clue_type_name: string;
}

function mapLocalResults(rows: LocalRow[]): DatabaseResult[] {
  return rows.map((row) => ({
    answer: row.answer ?? '',
    clueType: row.clue_type_slug ?? 'unknown',
    clueTypeLabel: row.clue_type_name ?? 'Unknown',
    annotation: row.annotation ?? '',
    definition: row.definition_part ?? '',
    confidence: row.is_verified ? 'high' : 'medium',
    source: 'database' as const,
  }));
}

// ── Main entry point ──

/**
 * Search for matching clues in the database.
 *
 * If Supabase is configured, uses the remote database.
 * Otherwise, falls back to the local SQLite database (dev mode).
 */
export async function searchDatabase(
  clueText: string,
  letterPattern?: string
): Promise<DatabaseResult[]> {
  // Use local SQLite when Supabase isn't configured
  if (!hasSupabaseConfig()) {
    return searchLocalDatabase(clueText, letterPattern);
  }

  // Supabase path (unchanged)
  try {
    const supabase = await createServerSupabaseClient();

    // Clean clue text for search
    const cleanClue = normalizeText(clueText.replace(/\(\d+(?:,\d+)*\)\s*$/, '').trim());

    // Try full-text search first
    let query = supabase
      .from('clues')
      .select(
        `
        answer,
        clue_type_id,
        annotation,
        definition_part,
        difficulty,
        is_verified,
        clue_types!inner(name, slug)
      `
      )
      .textSearch('clue_text', cleanClue, {
        type: 'websearch',
        config: 'english',
      })
      .eq('is_verified', true)
      .limit(5);

    // Filter by letter pattern if provided
    if (letterPattern) {
      const pattern = letterPattern.replace(/[^0-9,]/g, '');
      if (pattern) {
        query = query.eq('letter_pattern', pattern);
      }
    }

    const { data, error } = await query;

    if (error) {
      // Full-text search might not be set up — fall back to ILIKE
      const fallbackQuery = supabase
        .from('clues')
        .select(
          `
          answer,
          clue_type_id,
          annotation,
          definition_part,
          difficulty,
          is_verified,
          clue_types!inner(name, slug)
        `
        )
        .ilike('clue_text', `%${cleanClue}%`)
        .eq('is_verified', true)
        .limit(5);

      const { data: fallbackData, error: fallbackError } =
        await fallbackQuery;

      if (fallbackError || !fallbackData?.length) return [];

      return mapResults(fallbackData);
    }

    if (!data?.length) return [];

    return mapResults(data);
  } catch (err) {
    // Database not available — return empty
    if (process.env.NODE_ENV === 'development') {
      console.error('[solver] Supabase search failed:', err);
    }
    return [];
  }
}

/**
 * Map raw Supabase rows to DatabaseResult objects.
 */
function mapResults(rows: Record<string, unknown>[]): DatabaseResult[] {
  return rows.map((row) => {
    const clueTypes = row.clue_types as
      | { name: string; slug: string }
      | undefined;
    return {
      answer: (row.answer as string) ?? '',
      clueType: clueTypes?.slug ?? 'unknown',
      clueTypeLabel: clueTypes?.name ?? 'Unknown',
      annotation: (row.annotation as string) ?? '',
      definition: (row.definition_part as string) ?? '',
      confidence: (row.is_verified as boolean) ? 'high' : 'medium',
      source: 'database' as const,
    };
  });
}
