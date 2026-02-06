import { NextRequest, NextResponse } from 'next/server';
import { solveClue } from '@/lib/claude/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { MAX_CLUE_LENGTH } from '@/lib/constants';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.`,
        code: 'RATE_LIMITED',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateCheck.retryAfter),
        },
      }
    );
  }

  // Parse body
  let body: { clue?: string; letterPattern?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const { clue, letterPattern, mode } = body;

  // Validate required fields
  if (!clue || typeof clue !== 'string' || clue.trim().length === 0) {
    return NextResponse.json(
      { error: 'Clue is required', code: 'MISSING_CLUE' },
      { status: 400 }
    );
  }

  if (clue.length > MAX_CLUE_LENGTH) {
    return NextResponse.json(
      {
        error: `Clue must be ${MAX_CLUE_LENGTH} characters or less`,
        code: 'CLUE_TOO_LONG',
      },
      { status: 400 }
    );
  }

  if (mode !== 'hint' && mode !== 'answer') {
    return NextResponse.json(
      { error: 'Mode must be "hint" or "answer"', code: 'INVALID_MODE' },
      { status: 400 }
    );
  }

  // Call Claude
  try {
    const result = await solveClue(
      clue.trim(),
      mode,
      letterPattern?.trim() || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Solve error:', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    // Don't expose internal details
    const safeMessage = message.includes('ANTHROPIC_API_KEY')
      ? 'API configuration error. Please contact support.'
      : 'Failed to analyze clue. Please try again.';

    return NextResponse.json(
      { error: safeMessage, code: 'SOLVE_ERROR' },
      { status: 500 }
    );
  }
}
