import path from "node:path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeText } from "@/lib/utils";

interface DatabaseResult {
  answer: string;
  clueType: string;
  clueTypeLabel: string;
  annotation: string;
  definition: string;
  confidence: "high" | "medium" | "low";
  source: "database";
}

/** Minimum Jaccard word-overlap score to accept a DB result. */
export const MIN_MATCH_SCORE = 0.4;

/** Common words that inflate match scores without indicating a real clue match. */
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "it",
  "of",
  "in",
  "to",
  "for",
  "on",
  "at",
  "by",
  "or",
  "and",
  "but",
  "not",
  "no",
  "so",
  "as",
  "if",
  "be",
  "do",
  "has",
  "had",
  "was",
  "are",
  "were",
  "been",
  "have",
  "with",
  "from",
  "this",
  "that",
]);

/** Minimum number of non-stop-word matches required to accept a result. */
const MIN_INTERSECTING_WORDS = 2;

/**
 * Compute Jaccard word-overlap similarity between two clue strings.
 * Returns 0.0 (no overlap) to 1.0 (identical word sets).
 *
 * NOTE: Uses its own aggressive normalization (strip all punctuation) which
 * differs from normalizeText() — this is intentional for fuzzy word-set comparison.
 */
export function clueMatchScore(inputClue: string, storedClue: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0 && !STOP_WORDS.has(w));

  const inputWords = new Set(normalize(inputClue));
  const storedWords = new Set(normalize(storedClue));

  if (inputWords.size === 0 || storedWords.size === 0) return 0;

  let intersection = 0;
  for (const w of inputWords) {
    if (storedWords.has(w)) intersection++;
  }

  // Require at least 2 meaningful word matches to prevent short-clue false positives
  if (intersection < MIN_INTERSECTING_WORDS) return 0;

  const union = new Set([...inputWords, ...storedWords]).size;
  return intersection / union;
}

/**
 * Cap confidence based on clue match score.
 * - >= 0.8: keep original confidence
 * - >= 0.6: cap at "medium"
 * - >= 0.4: cap at "low"
 */
export function adjustConfidence(
  original: "high" | "medium" | "low",
  score: number
): "high" | "medium" | "low" {
  if (score >= 0.8) return original;
  if (score >= 0.6) {
    return original === "high" ? "medium" : original;
  }
  return "low";
}

/**
 * Check whether a real Supabase URL is configured.
 * Returns false for missing or placeholder values.
 */
function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !url.startsWith("YOUR_") && !!key && !key.startsWith("YOUR_");
}

// ── Local SQLite fallback ──

const LOCAL_DB_PATH = path.join(
  process.cwd(),
  "scripts",
  "data",
  "clues-local.db"
);

/** Cached better-sqlite3 Database instance (lazy-loaded, read-only). */
let localDb: import("better-sqlite3").Database | null = null;

/**
 * Get or create the cached local SQLite connection.
 * Returns null if the DB file doesn't exist or better-sqlite3 isn't available.
 */
function getLocalDb(): import("better-sqlite3").Database | null {
  if (localDb) return localDb;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database =
      require("better-sqlite3") as typeof import("better-sqlite3");
    const fs = require("node:fs") as typeof import("fs");

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

  const cleanClue = normalizeText(
    clueText.replace(/\(\d+(?:,\d+)*\)\s*$/, "").trim()
  );
  // Escape LIKE wildcards so user input can't pattern-inject
  const escapedClue = cleanClue.replace(/[%_\\]/g, "\\$&");

  // Build optional letter_pattern filter
  let patternFilter = "";
  const params: (string | number)[] = [];

  if (letterPattern) {
    const pattern = letterPattern.replace(/[^0-9,]/g, "");
    if (pattern) {
      patternFilter = "AND c.letter_pattern = ?";
      params.push(pattern);
    }
  }

  // Try FTS5 full-text search first
  try {
    const ftsRows = db
      .prepare(
        `
        SELECT c.answer, c.clue_text, c.annotation, c.definition_part, c.is_verified,
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
      return filterAndMapLocal(ftsRows, cleanClue);
    }
  } catch (err) {
    // FTS query failed (e.g. special characters) — fall through to LIKE
    if (process.env.NODE_ENV === "development") {
      console.error("[solver] FTS search failed:", err);
    }
  }

  // Fallback: LIKE search (uses ESCAPE '\' so % and _ in input are treated as literals)
  try {
    const likeRows = db
      .prepare(
        `
        SELECT c.answer, c.clue_text, c.annotation, c.definition_part, c.is_verified,
               ct.slug AS clue_type_slug, ct.name AS clue_type_name
        FROM clues c
        JOIN clue_types ct ON ct.id = c.clue_type_id
        WHERE c.clue_text LIKE ? ESCAPE '\\'
          ${patternFilter}
        LIMIT 5
        `
      )
      .all(`%${escapedClue}%`, ...params) as LocalRow[];

    return filterAndMapLocal(likeRows, cleanClue);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[solver] LIKE search failed:", err);
    }
    return [];
  }
}

interface LocalRow {
  answer: string;
  clue_text: string;
  annotation: string;
  definition_part: string;
  is_verified: number;
  clue_type_slug: string;
  clue_type_name: string;
}

/**
 * Filter local results by clue similarity, sort by best match, and map to DatabaseResult.
 */
function filterAndMapLocal(
  rows: LocalRow[],
  inputClue: string
): DatabaseResult[] {
  return rows
    .map((row) => {
      const score = clueMatchScore(inputClue, row.clue_text ?? "");
      const baseConfidence: "high" | "medium" | "low" = row.is_verified
        ? "high"
        : "medium";
      return {
        row,
        score,
        confidence: adjustConfidence(baseConfidence, score),
      };
    })
    .filter(({ score }) => score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score)
    .map(({ row, confidence }) => ({
      answer: row.answer ?? "",
      clueType: row.clue_type_slug ?? "unknown",
      clueTypeLabel: row.clue_type_name ?? "Unknown",
      annotation: row.annotation ?? "",
      definition: row.definition_part ?? "",
      confidence,
      source: "database" as const,
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

    // Clean clue text for search; escape LIKE wildcards for the ilike fallback
    const cleanClue = normalizeText(
      clueText.replace(/\(\d+(?:,\d+)*\)\s*$/, "").trim()
    );
    const escapedClue = cleanClue.replace(/[%_\\]/g, "\\$&");

    // Try full-text search first
    let query = supabase
      .from("clues")
      .select(
        `
        answer,
        clue_text,
        clue_type_id,
        annotation,
        definition_part,
        difficulty,
        is_verified,
        clue_types!inner(name, slug)
      `
      )
      .textSearch("clue_text", cleanClue, {
        type: "websearch",
        config: "english",
      })
      .eq("is_verified", true)
      .limit(5);

    // Filter by letter pattern if provided
    if (letterPattern) {
      const pattern = letterPattern.replace(/[^0-9,]/g, "");
      if (pattern) {
        query = query.eq("letter_pattern", pattern);
      }
    }

    const { data, error } = await query;

    if (error) {
      // Full-text search might not be set up — fall back to ILIKE
      let fallbackQuery = supabase
        .from("clues")
        .select(
          `
          answer,
          clue_text,
          clue_type_id,
          annotation,
          definition_part,
          difficulty,
          is_verified,
          clue_types!inner(name, slug)
        `
        )
        .ilike("clue_text", `%${escapedClue}%`)
        .eq("is_verified", true)
        .limit(5);

      if (letterPattern) {
        const pattern = letterPattern.replace(/[^0-9,]/g, "");
        if (pattern) {
          fallbackQuery = fallbackQuery.eq("letter_pattern", pattern);
        }
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;

      if (fallbackError || !fallbackData?.length) return [];

      return filterAndMapResults(fallbackData, cleanClue);
    }

    if (!data?.length) return [];

    return filterAndMapResults(data, cleanClue);
  } catch (err) {
    // Database not available — return empty
    if (process.env.NODE_ENV === "development") {
      console.error("[solver] Supabase search failed:", err);
    }
    return [];
  }
}

/**
 * Filter Supabase rows by clue similarity, sort by best match, and map to DatabaseResult.
 */
function filterAndMapResults(
  rows: Record<string, unknown>[],
  inputClue: string
): DatabaseResult[] {
  return rows
    .map((row) => {
      const score = clueMatchScore(inputClue, (row.clue_text as string) ?? "");
      const clueTypes = row.clue_types as
        | { name: string; slug: string }
        | undefined;
      const baseConfidence: "high" | "medium" | "low" =
        (row.is_verified as boolean) ? "high" : "medium";
      return {
        result: {
          answer: (row.answer as string) ?? "",
          clueType: clueTypes?.slug ?? "unknown",
          clueTypeLabel: clueTypes?.name ?? "Unknown",
          annotation: (row.annotation as string) ?? "",
          definition: (row.definition_part as string) ?? "",
          confidence: adjustConfidence(baseConfidence, score),
          source: "database" as const,
        },
        score,
      };
    })
    .filter(({ score }) => score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score)
    .map(({ result }) => result);
}
