import { NextRequest, NextResponse } from 'next/server';
import { CLUE_EXAMPLES } from '@/data/clue-types';

/**
 * GET /api/clues
 * Browse and search the curated clue examples.
 * Query params: ?type=anagram&difficulty=1&q=search+term
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type');
  const difficultyFilter = searchParams.get('difficulty');
  const query = searchParams.get('q')?.toLowerCase();

  let results = [...CLUE_EXAMPLES];

  if (typeFilter) {
    results = results.filter((c) => c.clueTypeSlug === typeFilter);
  }

  if (difficultyFilter) {
    const diff = parseInt(difficultyFilter, 10);
    if (diff >= 1 && diff <= 3) {
      results = results.filter((c) => c.difficulty === diff);
    }
  }

  if (query) {
    results = results.filter(
      (c) =>
        c.clueText.toLowerCase().includes(query) ||
        c.answer.toLowerCase().includes(query) ||
        c.explanation.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    clues: results,
    total: results.length,
  });
}
