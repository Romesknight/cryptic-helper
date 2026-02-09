import { CLUE_TYPES } from '@/data/clue-types';
import { getAnagrams, matchesPattern, parsePatternLength } from './dictionary';

const anagramType = CLUE_TYPES.find((t) => t.slug === 'anagram');
const ANAGRAM_INDICATORS = anagramType?.commonIndicators ?? [];

interface AnagramCandidate {
  answer: string;
  fodder: string;
  indicator: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Detect an anagram indicator word in the clue text.
 * Returns the indicator and its position, or null.
 */
function findAnagramIndicator(
  words: string[]
): { indicator: string; index: number } | null {
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (ANAGRAM_INDICATORS.includes(word)) {
      return { indicator: word, index: i };
    }
  }
  return null;
}

/**
 * Extract candidate fodder (letters to anagram) from the clue.
 * Fodder is typically adjacent to the indicator, excluding the definition.
 */
function extractFodder(
  words: string[],
  indicatorIndex: number,
  targetLength: number | null
): string[] {
  const candidates: string[] = [];

  // Try words before the indicator as fodder
  if (indicatorIndex > 0) {
    let fodder = '';
    for (let i = indicatorIndex - 1; i >= 0; i--) {
      const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
      fodder = word + fodder;
      if (targetLength === null || fodder.length === targetLength) {
        candidates.push(fodder);
      }
    }
  }

  // Try words after the indicator as fodder
  if (indicatorIndex < words.length - 1) {
    let fodder = '';
    for (let i = indicatorIndex + 1; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
      fodder = fodder + word;
      if (targetLength === null || fodder.length === targetLength) {
        candidates.push(fodder);
      }
    }
  }

  return candidates;
}

/**
 * Attempt to solve a clue as an anagram.
 * Returns candidate answers ranked by confidence.
 */
export async function solveAnagram(
  clueText: string,
  letterPattern?: string
): Promise<AnagramCandidate[]> {
  // Strip the letter count pattern from the clue text (e.g., "(8)")
  const cleanClue = clueText.replace(/\(\d+(?:,\d+)*\)\s*$/, '').trim();
  const words = cleanClue.split(/\s+/);

  const indicatorResult = findAnagramIndicator(words);
  if (!indicatorResult) return [];

  const targetLength = parsePatternLength(letterPattern);
  const fodderCandidates = extractFodder(
    words,
    indicatorResult.index,
    targetLength
  );

  const results: AnagramCandidate[] = [];

  for (const fodder of fodderCandidates) {
    const anagrams = await getAnagrams(fodder);
    for (const anagram of anagrams) {
      // Skip if the anagram is the same as the fodder
      if (anagram === fodder) continue;
      // Check letter pattern
      if (!matchesPattern(anagram, letterPattern)) continue;

      results.push({
        answer: anagram.toUpperCase(),
        fodder,
        indicator: indicatorResult.indicator,
        confidence: anagrams.length === 1 ? 'high' : 'medium',
      });
    }
  }

  return results;
}
