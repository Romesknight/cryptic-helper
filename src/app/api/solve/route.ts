import { NextRequest, NextResponse } from 'next/server';
import { solveClue } from '@/lib/gemini/client';
import { solveTraditional } from '@/lib/solvers';
import { checkRateLimit } from '@/lib/rate-limit';
import { MAX_CLUE_LENGTH } from '@/lib/constants';
import type { SolveMethod, SolveResultWithMethod } from '@/types/api';

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
  let body: {
    clue?: string;
    letterPattern?: string;
    mode?: string;
    method?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const { clue, letterPattern, mode, method: rawMethod } = body;

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

  // Default to traditional if method not specified
  const method: SolveMethod =
    rawMethod === 'ai' || rawMethod === 'both' ? rawMethod : 'traditional';

  const trimmedClue = clue.trim();
  const trimmedPattern = letterPattern?.trim() || undefined;

  try {
    if (method === 'traditional') {
      const result = await solveTraditional(trimmedClue, mode, trimmedPattern);
      return NextResponse.json(result);
    }

    if (method === 'ai') {
      const result = await solveClue(trimmedClue, mode, trimmedPattern);
      return NextResponse.json(result);
    }

    // method === 'both': run in parallel, return array
    const [traditionalResult, aiResult] = await Promise.allSettled([
      solveTraditional(trimmedClue, mode, trimmedPattern),
      solveClue(trimmedClue, mode, trimmedPattern),
    ]);

    const results: SolveResultWithMethod[] = [];

    if (traditionalResult.status === 'fulfilled') {
      results.push({ method: 'traditional', result: traditionalResult.value });
    }
    if (aiResult.status === 'fulfilled') {
      results.push({ method: 'ai', result: aiResult.value });
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Both solvers failed. Please try again.', code: 'SOLVE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Solve error:', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    // Don't expose internal details
    const safeMessage = message.includes('API_KEY')
      ? 'API configuration error. Please contact support.'
      : 'Failed to analyze clue. Please try again.';

    return NextResponse.json(
      { error: safeMessage, code: 'SOLVE_ERROR' },
      { status: 500 }
    );
  }
}
