import { searchDatabase } from './database';
import { solveAnagram } from './anagram';
import { solveHiddenWord } from './hidden-word';
import type { SolveResponse, SolveAnswerResponse, SolveHintResponse } from '@/types/api';

/**
 * Solve a cryptic clue using traditional (non-AI) methods.
 *
 * Strategy (in order, stop on first confident match):
 * 1. Database full-text search (fastest for known clues)
 * 2. Hidden word scan (deterministic, high confidence when found)
 * 3. Anagram solver (high confidence when unique match found)
 * 4. Return best result or "no match found"
 */
export async function solveTraditional(
  clue: string,
  mode: 'hint' | 'answer',
  letterPattern?: string
): Promise<SolveResponse> {
  // 1. Try database lookup first (fastest for known clues)
  try {
    const dbResults = await searchDatabase(clue, letterPattern);
    if (dbResults.length > 0) {
      const best = dbResults[0];
      if (mode === 'answer') {
        return {
          answer: best.answer,
          clueType: best.clueType,
          clueTypeLabel: best.clueTypeLabel,
          annotation: best.annotation,
          definition: best.definition,
          confidence: best.confidence,
        } satisfies SolveAnswerResponse;
      }
      return {
        hint: `This is a ${best.clueTypeLabel} clue. The definition part is "${best.definition}". The answer has ${best.answer.length} letters.`,
        clueType: best.clueType,
        clueTypeLabel: best.clueTypeLabel,
        definition: best.definition,
        confidence: best.confidence,
      } satisfies SolveHintResponse;
    }
  } catch (err) {
    // Database unavailable — continue to other methods
    if (process.env.NODE_ENV === 'development') {
      console.error('[solver] Database search failed:', err);
    }
  }

  // 2. Try hidden word solver
  const hiddenResults = await solveHiddenWord(clue, letterPattern);
  if (hiddenResults.length > 0) {
    const best = hiddenResults[0];
    if (mode === 'answer') {
      return {
        answer: best.answer,
        clueType: 'hidden-word',
        clueTypeLabel: 'Hidden Word',
        annotation: `HIDDEN WORD: **${best.answer}** — [${best.indicator}] is the hidden word indicator. The answer is concealed within the clue text.`,
        definition: '(definition detected from clue context)',
        confidence: best.confidence,
      } satisfies SolveAnswerResponse;
    }
    return {
      hint: `This appears to be a Hidden Word clue. Look for the answer hidden within the consecutive letters of the clue. The indicator "${best.indicator}" signals this.`,
      clueType: 'hidden-word',
      clueTypeLabel: 'Hidden Word',
      definition: '(hidden within the clue text)',
      confidence: best.confidence,
    } satisfies SolveHintResponse;
  }

  // 3. Try anagram solver
  const anagramResults = await solveAnagram(clue, letterPattern);
  if (anagramResults.length > 0) {
    const best = anagramResults[0];
    if (mode === 'answer') {
      return {
        answer: best.answer,
        clueType: 'anagram',
        clueTypeLabel: 'Anagram',
        annotation: `ANAGRAM: **${best.answer}** — [${best.indicator}] is the anagram indicator. {${best.fodder.toUpperCase()}} rearranged → **${best.answer}**.`,
        definition: '(definition detected from clue context)',
        confidence: best.confidence,
      } satisfies SolveAnswerResponse;
    }
    return {
      hint: `This appears to be an Anagram clue. The indicator "${best.indicator}" signals that letters need rearranging. Look at the letters of "${best.fodder}" — they can form the answer.`,
      clueType: 'anagram',
      clueTypeLabel: 'Anagram',
      definition: '(anagram of ' + best.fodder + ')',
      confidence: best.confidence,
    } satisfies SolveHintResponse;
  }

  // 4. No match found — return a helpful "no result" response
  if (mode === 'answer') {
    return {
      answer: '(no match found)',
      clueType: 'unknown',
      clueTypeLabel: 'Unknown',
      annotation:
        'Traditional solver could not find a confident match. Try the AI solver for more complex clue types.',
      definition: '',
      confidence: 'low',
    } satisfies SolveAnswerResponse;
  }

  return {
    hint: 'The traditional solver could not identify the clue type or find a match. Try the AI solver for more complex clues, or check the Learn section for clue type patterns.',
    clueType: 'unknown',
    clueTypeLabel: 'Unknown',
    definition: '',
    confidence: 'low',
  } satisfies SolveHintResponse;
}
