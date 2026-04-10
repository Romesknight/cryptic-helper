/**
 * Shared TypeScript interfaces for the eigenfoo import pipeline.
 */

/**
 * Raw row from the eigenfoo SQLite database (clues JOIN indicators_by_clue).
 *
 * The indicators_by_clue table has one column per wordplay type. Each column
 * contains the indicator word (e.g., "transforming" for anagram) or empty string.
 */
export interface EigenfooRawRow {
  clue: string;
  answer: string;
  definition: string;
  clue_number: string | null;
  puzzle_date: string | null;
  puzzle_name: string | null;
  source_url: string | null;
  source: string | null;
  /** Indicator word for anagram (e.g., "broken", "mangled"), or empty. */
  anagram: string;
  /** Indicator word for hidden word (e.g., "found in", "part of"), or empty. */
  hidden: string;
  /** Indicator word for reversal (e.g., "returned", "back"), or empty. */
  reversal: string;
  /** Indicator word for container (e.g., "around", "holding"), or empty. */
  container: string;
  /** Indicator word for insertion (e.g., "in", "inside"), or empty. */
  insertion: string;
  /** Indicator word for homophone (e.g., "reportedly", "we hear"), or empty. */
  homophone: string;
  /** Indicator word for deletion (e.g., "losing", "without"), or empty. */
  deletion: string;
  /** Indicator word for alternation (e.g., "oddly", "regularly"), or empty. */
  alternation: string;
}

/**
 * eigenfoo indicator type column names.
 * Each column in indicators_by_clue contains the indicator word (or empty string).
 */
export type EigenfooIndicatorType =
  | "anagram"
  | "hidden"
  | "reversal"
  | "container"
  | "insertion"
  | "homophone"
  | "deletion"
  | "alternation";

/** All indicator columns, used for iteration. */
export const INDICATOR_COLUMNS: EigenfooIndicatorType[] = [
  "anagram",
  "hidden",
  "reversal",
  "container",
  "insertion",
  "homophone",
  "deletion",
  "alternation",
];

/** Our app's clue type slugs. */
export type ClueTypeSlug =
  | "anagram"
  | "hidden-word"
  | "reversal"
  | "container"
  | "homophone"
  | "deletion";

/** Mapping from eigenfoo indicator_type to our slug. */
export const INDICATOR_TYPE_MAP: Record<EigenfooIndicatorType, ClueTypeSlug> = {
  anagram: "anagram",
  hidden: "hidden-word",
  reversal: "reversal",
  container: "container",
  insertion: "container",
  homophone: "homophone",
  deletion: "deletion",
  alternation: "deletion",
};

/** A clue ready for Supabase insertion. */
export interface TransformedClue {
  clue_text: string;
  answer: string;
  letter_pattern: string;
  clue_type_slug: ClueTypeSlug;
  annotation: string;
  definition_part: string;
  wordplay_part: string;
  difficulty: number;
  source: string;
  is_verified: boolean;
}
