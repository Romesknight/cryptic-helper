/**
 * Transform and sanitize raw eigenfoo rows into clues ready for Supabase insertion.
 *
 * Uses the actual indicator words from the eigenfoo database to generate
 * rich annotations and wordplay descriptions for hint generation.
 */

import { normalizeText } from "../../src/lib/utils.js";
import type {
  ClueTypeSlug,
  EigenfooIndicatorType,
  EigenfooRawRow,
  TransformedClue,
} from "./types.js";
import { INDICATOR_COLUMNS, INDICATOR_TYPE_MAP } from "./types.js";

// ── Sanitization ──

/** Strip all HTML tags from a string. */
function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/** Remove non-printable characters, normalize unicode, and normalize typographic chars to ASCII. */
function sanitizeText(text: string): string {
  return normalizeText(
    stripHtml(text)
      .normalize("NFC")
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — strips raw control chars from input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim()
  );
}

// ── Validation ──

const ANSWER_RE = /^[A-Z]+$/;
const LETTER_PATTERN_RE = /^\d+([,]\d+)*$/;

function isValidAnswer(answer: string): boolean {
  return answer.length >= 1 && answer.length <= 30 && ANSWER_RE.test(answer);
}

function isValidClueText(text: string): boolean {
  return text.length >= 5 && text.length <= 300;
}

function isValidDefinition(def: string): boolean {
  return def.length >= 1 && def.length <= 200;
}

function isValidLetterPattern(pattern: string): boolean {
  return LETTER_PATTERN_RE.test(pattern);
}

// ── Extraction ──

/**
 * Extract letter pattern from clue enumeration, e.g. "Some clue (4,3)" -> "4,3".
 * Falls back to answer length if no enumeration found.
 */
function extractLetterPattern(clueText: string, answer: string): string {
  const match = clueText.match(/\((\d+(?:[,-]\d+)*)\)\s*$/);
  if (match) {
    return match[1].replace(/-/g, ",");
  }
  return String(answer.length);
}

/** Compute total letter count from a letter pattern like "4,3" -> 7. */
function letterPatternTotal(pattern: string): number {
  return pattern.split(",").reduce((sum, n) => sum + parseInt(n, 10), 0);
}

// ── Indicator Analysis ──

/** Human-readable names for indicator types. */
const TYPE_LABELS: Record<EigenfooIndicatorType, string> = {
  anagram: "Anagram",
  hidden: "Hidden word",
  reversal: "Reversal",
  container: "Container",
  insertion: "Insertion",
  homophone: "Homophone",
  deletion: "Deletion",
  alternation: "Alternation",
};

/** Descriptions of what each indicator type means in the wordplay. */
const TYPE_DESCRIPTIONS: Record<EigenfooIndicatorType, string> = {
  anagram: "letters are rearranged to form the answer",
  hidden: "the answer is concealed within the clue text",
  reversal: "letters or a word are reversed to form part of the answer",
  container: "one component wraps around another",
  insertion: "one component is placed inside another",
  homophone: "the answer or a component sounds like another word",
  deletion: "letters are removed from a word to form part of the answer",
  alternation: "alternate letters are taken from a word or phrase",
};

interface IndicatorInfo {
  type: EigenfooIndicatorType;
  word: string;
}

/**
 * Extract all non-empty indicator types and their words from a raw row.
 * Returns them in priority order (the column order from INDICATOR_COLUMNS).
 */
function getIndicators(row: EigenfooRawRow): IndicatorInfo[] {
  const indicators: IndicatorInfo[] = [];
  for (const col of INDICATOR_COLUMNS) {
    const word = row[col];
    if (word && word.trim() !== "") {
      indicators.push({ type: col, word: word.trim() });
    }
  }
  return indicators;
}

/**
 * Determine the primary clue type from all present indicators.
 * Uses the first non-empty indicator column in priority order.
 */
function getPrimaryType(
  indicators: IndicatorInfo[]
): EigenfooIndicatorType | null {
  return indicators.length > 0 ? indicators[0].type : null;
}

// ── Rich Annotation & Wordplay Generation ──

/**
 * Build a detailed wordplay_part string from the indicator data.
 *
 * Examples:
 *   'Anagram indicated by "broken"; letters rearranged to form the answer'
 *   'Hidden word indicated by "found in"; the answer is concealed within the clue text'
 *   'Container indicated by "holding" + Reversal indicated by "back"'
 */
function buildWordplayPart(indicators: IndicatorInfo[]): string {
  if (indicators.length === 0) return "wordplay type unknown";

  const parts = indicators.map((ind) => {
    const label = TYPE_LABELS[ind.type];
    return `${label} indicated by "${ind.word}"`;
  });

  return parts.join(" + ");
}

/**
 * Build a detailed annotation string combining all indicator information.
 *
 * Examples:
 *   'ANAGRAM: MEDIEVAL — "broken" signals rearrangement. Definition: "in the Middle Ages"'
 *   'HIDDEN WORD + INSERTION: RARER — "instalment of" signals hidden word,
 *    "instalment of" signals insertion. Definition: "Less common"'
 */
function buildAnnotation(
  answer: string,
  definition: string,
  indicators: IndicatorInfo[],
  _primaryType: EigenfooIndicatorType
): string {
  const typeHeader = indicators
    .map((ind) => TYPE_LABELS[ind.type].toUpperCase())
    .join(" + ");

  const details = indicators
    .map((ind) => `"${ind.word}" signals ${TYPE_DESCRIPTIONS[ind.type]}`)
    .join("; ");

  return `${typeHeader}: ${answer} — ${details}. Definition: "${definition}"`;
}

// ── Difficulty Heuristic ──

const COMPLEX_TYPES: ClueTypeSlug[] = ["container", "reversal"];
const SIMPLE_TYPES: ClueTypeSlug[] = ["hidden-word"];

function calcDifficulty(
  answer: string,
  clueTypeSlug: ClueTypeSlug,
  clueText: string,
  indicatorCount: number
): number {
  let score = 0;

  // Answer length factor
  if (answer.length > 8) score += 2;
  else if (answer.length > 5) score += 1;

  // Type complexity factor
  if (COMPLEX_TYPES.includes(clueTypeSlug)) score += 2;
  else if (!SIMPLE_TYPES.includes(clueTypeSlug)) score += 1;

  // Clue length factor
  if (clueText.length > 60) score += 1;

  // Multiple wordplay devices make it harder
  if (indicatorCount >= 2) score += 1;

  if (score <= 2) return 1;
  if (score <= 4) return 2;
  return 3;
}

// ── Main Transform ──

export interface TransformResult {
  clue: TransformedClue | null;
  error: string | null;
}

/**
 * Transform a raw eigenfoo row into a sanitized clue for Supabase,
 * using all available indicator data for rich annotations.
 */
export function transformRow(row: EigenfooRawRow): TransformResult {
  // Sanitize fields
  const answer = sanitizeText(row.answer)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const clueText = sanitizeText(row.clue);
  const definition = sanitizeText(row.definition);

  // Extract all indicator info from the row
  const indicators = getIndicators(row);
  if (indicators.length === 0) {
    return { clue: null, error: "No indicator types found" };
  }

  // biome-ignore lint/style/noNonNullAssertion: indicators is non-empty (checked above)
  const primaryType = getPrimaryType(indicators)!;
  const clueTypeSlug = INDICATOR_TYPE_MAP[primaryType];

  // Validate answer
  if (!isValidAnswer(answer)) {
    return { clue: null, error: `Invalid answer: "${answer}"` };
  }

  // Validate clue text
  if (!isValidClueText(clueText)) {
    return {
      clue: null,
      error: `Invalid clue text (len=${clueText.length}): "${clueText.slice(0, 50)}"`,
    };
  }

  // Validate definition
  if (!isValidDefinition(definition)) {
    return {
      clue: null,
      error: `Invalid definition (len=${definition.length}): "${definition.slice(0, 50)}"`,
    };
  }

  // Extract & validate letter pattern
  const letterPattern = extractLetterPattern(clueText, answer);
  if (!isValidLetterPattern(letterPattern)) {
    return { clue: null, error: `Invalid letter pattern: "${letterPattern}"` };
  }

  // Cross-check letter pattern total matches answer length
  const patternTotal = letterPatternTotal(letterPattern);
  if (patternTotal !== answer.length) {
    return {
      clue: null,
      error: `Letter pattern total (${patternTotal}) != answer length (${answer.length}) for "${answer}"`,
    };
  }

  // Build source string
  const source = row.puzzle_name
    ? sanitizeText(row.puzzle_name)
    : row.source
      ? sanitizeText(row.source)
      : "eigenfoo/cryptics";

  // Strip enumeration from clue text for storage
  const clueTextClean = clueText
    .replace(/\s*\(\d+(?:[,-]\d+)*\)\s*$/, "")
    .trim();

  if (!isValidClueText(clueTextClean)) {
    return {
      clue: null,
      error: `Clue text too short after stripping enumeration: "${clueTextClean}"`,
    };
  }

  return {
    clue: {
      clue_text: clueTextClean,
      answer,
      letter_pattern: letterPattern,
      clue_type_slug: clueTypeSlug,
      annotation: buildAnnotation(answer, definition, indicators, primaryType),
      definition_part: definition,
      wordplay_part: buildWordplayPart(indicators),
      difficulty: calcDifficulty(
        answer,
        clueTypeSlug,
        clueTextClean,
        indicators.length
      ),
      source,
      is_verified: true,
    },
    error: null,
  };
}
