import { NextRequest, NextResponse } from 'next/server';
import { CLUE_EXAMPLES } from '@/data/clue-types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clues/:id
 * Returns a single clue example by its ID.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const clue = CLUE_EXAMPLES.find((c) => c.id === id);

  if (!clue) {
    return NextResponse.json(
      { error: 'Clue not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json(clue);
}
