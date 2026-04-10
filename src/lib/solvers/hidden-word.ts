import { CLUE_TYPES } from "@/data/clue-types";
import { isWord, parsePatternLength } from "./dictionary";

const hiddenType = CLUE_TYPES.find((t) => t.slug === "hidden-word");
const HIDDEN_INDICATORS = hiddenType?.commonIndicators ?? [];

interface HiddenWordCandidate {
  answer: string;
  indicator: string;
  span: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Detect a hidden word indicator phrase in the clue text.
 * Checks both single-word and multi-word indicators.
 */
function findHiddenIndicator(
  clueText: string
): { indicator: string; startPos: number; endPos: number } | null {
  const lower = clueText.toLowerCase();

  // Sort indicators by length (longest first) to match multi-word indicators first
  const sorted = [...HIDDEN_INDICATORS].sort((a, b) => b.length - a.length);

  for (const indicator of sorted) {
    let searchStart = 0;
    while (searchStart < lower.length) {
      const idx = lower.indexOf(indicator, searchStart);
      if (idx === -1) break;

      // Only match on word boundaries — prevent matching "in" inside "interesting"
      const prevChar = idx > 0 ? lower[idx - 1] : null;
      const nextChar =
        idx + indicator.length < lower.length
          ? lower[idx + indicator.length]
          : null;
      const atWordBoundary =
        (prevChar === null || /\s/.test(prevChar)) &&
        (nextChar === null || /\s/.test(nextChar));

      if (atWordBoundary) {
        return {
          indicator,
          startPos: idx,
          endPos: idx + indicator.length,
        };
      }
      searchStart = idx + 1;
    }
  }
  return null;
}

/**
 * Extract all substrings of a given length from a text,
 * only considering alphabetic characters.
 */
function getSubstrings(text: string, length: number): string[] {
  const letters = text.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const results: string[] = [];
  for (let i = 0; i <= letters.length - length; i++) {
    results.push(letters.substring(i, i + length));
  }
  return results;
}

/**
 * Attempt to solve a clue as a hidden word.
 * Scans for substrings of the target length that are valid dictionary words.
 */
export async function solveHiddenWord(
  clueText: string,
  letterPattern?: string
): Promise<HiddenWordCandidate[]> {
  const cleanClue = clueText.replace(/\(\d+(?:,\d+)*\)\s*$/, "").trim();

  const indicatorResult = findHiddenIndicator(cleanClue);
  if (!indicatorResult) return [];

  const targetLength = parsePatternLength(letterPattern);
  if (!targetLength) return [];

  // For hidden words, we only look for single-word answers (no spaces)
  // The text to search is the clue minus the indicator and definition
  // Since definition placement varies, search the entire clue text
  const searchText = cleanClue;
  const substrings = getSubstrings(searchText, targetLength);

  const results: HiddenWordCandidate[] = [];
  const seen = new Set<string>();

  for (const substr of substrings) {
    if (seen.has(substr)) continue;
    seen.add(substr);

    if (await isWord(substr)) {
      results.push({
        answer: substr.toUpperCase(),
        indicator: indicatorResult.indicator,
        span: substr,
        confidence: "medium",
      });
    }
  }

  return results;
}
