import type { SolveResponse } from '@/types/api';

let wordSet: Set<string> | null = null;
let anagramIndex: Map<string, string[]> | null = null;
let wordsByLength: Map<number, string[]> | null = null;

/**
 * Sort a string's letters alphabetically to create an anagram signature.
 */
function sortLetters(word: string): string {
  return word.toLowerCase().split('').sort().join('');
}

/**
 * Lazily load and index the word list on first use.
 */
async function ensureLoaded(): Promise<void> {
  if (wordSet) return;

  // Dynamic import of the JSON word list
  const words: string[] = (await import('@/data/words.json')).default;

  wordSet = new Set(words.map((w) => w.toLowerCase()));
  anagramIndex = new Map();
  wordsByLength = new Map();

  for (const word of words) {
    const lower = word.toLowerCase();
    const sig = sortLetters(lower);

    // Build anagram index: signature → list of words
    const existing = anagramIndex.get(sig);
    if (existing) {
      existing.push(lower);
    } else {
      anagramIndex.set(sig, [lower]);
    }

    // Build length index
    const len = lower.length;
    const byLen = wordsByLength.get(len);
    if (byLen) {
      byLen.push(lower);
    } else {
      wordsByLength.set(len, [lower]);
    }
  }
}

/**
 * Check if a word exists in the dictionary.
 */
export async function isWord(word: string): Promise<boolean> {
  await ensureLoaded();
  return wordSet!.has(word.toLowerCase());
}

/**
 * Find all valid anagrams of the given letters.
 */
export async function getAnagrams(letters: string): Promise<string[]> {
  await ensureLoaded();
  const sig = sortLetters(letters.replace(/\s/g, ''));
  return anagramIndex!.get(sig) ?? [];
}

/**
 * Get all words of a given length.
 */
export async function getWordsOfLength(n: number): Promise<string[]> {
  await ensureLoaded();
  return wordsByLength!.get(n) ?? [];
}

/**
 * Check if a word matches a letter pattern like "(5)" or "(4,3)".
 * Returns true if the word length matches.
 */
export function matchesPattern(
  word: string,
  pattern: string | undefined
): boolean {
  if (!pattern) return true;
  const nums = pattern.replace(/[^0-9,]/g, '').split(',').map(Number);
  const totalLength = nums.reduce((a, b) => a + b, 0);
  return word.replace(/\s/g, '').length === totalLength;
}

/**
 * Parse a letter pattern string like "(8)" or "(4,6)" into total letter count.
 */
export function parsePatternLength(pattern: string | undefined): number | null {
  if (!pattern) return null;
  const nums = pattern.replace(/[^0-9,]/g, '').split(',').filter(Boolean).map(Number);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0);
}
