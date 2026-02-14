'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import ModeToggle from './ModeToggle';
import MethodToggle from './MethodToggle';
import AnnotatedClue from './AnnotatedClue';
import type {
  SolveResponse,
  SolveAnswerResponse,
  SolveHintResponse,
  SolveMethod,
  SolveResultWithMethod,
} from '@/types/api';

function isAnswerResponse(r: SolveResponse): r is SolveAnswerResponse {
  return 'answer' in r;
}

function isHintResponse(r: SolveResponse): r is SolveHintResponse {
  return 'hint' in r;
}

/**
 * Fetch a single solver method and return the result.
 */
async function fetchSolver(
  payload: { clue: string; letterPattern?: string; mode: string; method: 'traditional' | 'ai' },
  signal: AbortSignal
): Promise<SolveResultWithMethod> {
  const res = await fetch('/api/solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return { method: payload.method, result: data as SolveResponse };
}

/**
 * Cross-validate DB vs AI results and adjust AI confidence.
 * - Agreement (same answer, case-insensitive) → boost AI to "high"
 * - Disagreement (both have real answers) → cap AI at "medium"
 * - DB returned no match or hint mode → no adjustment
 */
function crossValidateResults(
  results: SolveResultWithMethod[]
): SolveResultWithMethod[] {
  if (results.length < 2) return results;

  const traditional = results.find((r) => r.method === 'traditional');
  const ai = results.find((r) => r.method === 'ai');
  if (!traditional || !ai) return results;

  // Only cross-validate in answer mode (both must have answer fields)
  if (!isAnswerResponse(traditional.result) || !isAnswerResponse(ai.result)) {
    return results;
  }

  const dbAnswer = traditional.result.answer.trim().toUpperCase();
  const aiAnswer = ai.result.answer.trim().toUpperCase();

  // DB returned no real match — nothing to validate against
  if (dbAnswer === '(NO MATCH FOUND)' || dbAnswer === '') {
    return results;
  }

  let adjustedConfidence = ai.result.confidence;

  if (dbAnswer === aiAnswer) {
    // Agreement: boost AI confidence to high
    adjustedConfidence = 'high';
  } else {
    // Disagreement: cap AI confidence at medium
    if (ai.result.confidence === 'high') {
      adjustedConfidence = 'medium';
    }
  }

  if (adjustedConfidence === ai.result.confidence) {
    return results;
  }

  return results.map((r) => {
    if (r.method === 'ai' && isAnswerResponse(r.result)) {
      return { ...r, result: { ...r.result, confidence: adjustedConfidence } satisfies SolveAnswerResponse };
    }
    return r;
  });
}

/**
 * Render a single solve result card.
 */
function ResultCard({
  result,
  methodLabel,
}: {
  result: SolveResponse;
  methodLabel?: string;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Method badge + clue type badge */}
        <div className="flex flex-wrap items-center gap-2">
          {methodLabel && (
            <Badge variant="default">{methodLabel}</Badge>
          )}
          <Badge variant="success">
            {isAnswerResponse(result)
              ? result.clueTypeLabel
              : result.clueTypeLabel}
          </Badge>
          <Badge
            variant={
              result.confidence === 'high'
                ? 'success'
                : result.confidence === 'medium'
                  ? 'warning'
                  : 'default'
            }
          >
            {result.confidence} confidence
          </Badge>
        </div>

        {/* Answer (answer mode only) */}
        {isAnswerResponse(result) && (
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">Answer</h3>
            <p className="text-2xl font-bold tracking-wider text-primary font-mono">
              {result.answer}
            </p>
          </div>
        )}

        {/* Hint (hint mode only) */}
        {isHintResponse(result) && (
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">Hint</h3>
            <p className="text-base leading-relaxed">{result.hint}</p>
          </div>
        )}

        {/* Definition */}
        <div>
          <h3 className="text-sm font-medium text-muted mb-1">Definition</h3>
          <p className="text-base italic">&ldquo;{result.definition}&rdquo;</p>
        </div>

        {/* Annotation (answer mode only) */}
        {isAnswerResponse(result) && (
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">Annotation</h3>
            <AnnotatedClue
              annotation={result.annotation}
              className="text-base leading-relaxed"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SolverForm() {
  const [clue, setClue] = useState('');
  const [letterPattern, setLetterPattern] = useState('');
  const [mode, setMode] = useState<'hint' | 'answer'>('hint');
  const [method, setMethod] = useState<SolveMethod>('traditional');
  const [loading, setLoading] = useState(false);
  const [loadingTraditional, setLoadingTraditional] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [bothResults, setBothResults] = useState<SolveResultWithMethod[]>([]);
  const [displayResults, setDisplayResults] = useState<SolveResultWithMethod[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Abort in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  // Cross-validate when both results arrive
  useEffect(() => {
    if (bothResults.length === 2) {
      setDisplayResults(crossValidateResults(bothResults));
    } else {
      setDisplayResults(bothResults);
    }
  }, [bothResults]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!clue.trim()) return;

      // Abort any in-flight requests
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      setResult(null);
      setBothResults([]);
      setDisplayResults([]);

      if (method === 'both') {
        // Fire two parallel fetches — each renders independently as it arrives
        setLoading(true);
        setLoadingTraditional(true);
        setLoadingAi(true);

        const payload = {
          clue: clue.trim(),
          letterPattern: letterPattern.trim() || undefined,
          mode,
        };

        const traditionalPromise = fetchSolver(
          { ...payload, method: 'traditional' },
          controller.signal
        )
          .then((r) => {
            setBothResults((prev) => [...prev, r]);
            setLoadingTraditional(false);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              setLoadingTraditional(false);
              setError((prev) => prev ?? `Traditional solver failed: ${err.message}`);
            }
          });

        const aiPromise = fetchSolver(
          { ...payload, method: 'ai' },
          controller.signal
        )
          .then((r) => {
            setBothResults((prev) => [...prev, r]);
            setLoadingAi(false);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              setLoadingAi(false);
              setError((prev) => prev ?? `AI solver failed: ${err.message}`);
            }
          });

        await Promise.allSettled([traditionalPromise, aiPromise]);
        setLoading(false);
      } else {
        // Single method — unchanged behavior
        setLoading(true);

        try {
          const res = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clue: clue.trim(),
              letterPattern: letterPattern.trim() || undefined,
              mode,
              method,
            }),
            signal: controller.signal,
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || 'Something went wrong');
            return;
          }

          setResult(data as SolveResponse);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          setError('Network error. Please check your connection and try again.');
        } finally {
          setLoading(false);
        }
      }
    },
    [clue, letterPattern, mode, method]
  );

  // Helper to find a result by method from displayResults
  const traditionalResult = displayResults.find((r) => r.method === 'traditional');
  const aiResult = displayResults.find((r) => r.method === 'ai');
  const showBothGrid = method === 'both' && (loadingTraditional || loadingAi || displayResults.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Cryptic clue"
            placeholder='e.g. "Crazy leader is deadlier (8)"'
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            maxLength={500}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-start">
            <Input
              label="Letter pattern (optional)"
              placeholder="e.g. 8 or 4,3"
              value={letterPattern}
              onChange={(e) => setLetterPattern(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3 sm:contents">
              <ModeToggle mode={mode} onChange={setMode} />
              <MethodToggle method={method} onChange={setMethod} />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !clue.trim()}
            size="lg"
            className="w-full sm:w-auto sm:self-end"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analysing...
              </span>
            ) : mode === 'hint' ? (
              'Get Hint'
            ) : (
              'Solve Clue'
            )}
          </Button>
        </form>
      </Card>

      {/* Results area with aria-live for screen readers */}
      <div aria-live="polite" aria-atomic="true">
        {/* Single method skeleton */}
        {loading && method !== 'both' && (
          <Card>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/50 bg-red-50 dark:bg-red-950/20">
            <p className="text-destructive font-medium">{error}</p>
          </Card>
        )}

        {/* Single result (traditional or ai) */}
        {result && !loading && (
          <ResultCard result={result} />
        )}

        {/* Side-by-side results (both) — renders incrementally */}
        {showBothGrid && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Traditional slot */}
            <div>
              {traditionalResult ? (
                <ResultCard
                  result={traditionalResult.result}
                  methodLabel="Traditional"
                />
              ) : loadingTraditional ? (
                <Card>
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </Card>
              ) : null}
            </div>

            {/* AI slot */}
            <div>
              {aiResult ? (
                <ResultCard
                  result={aiResult.result}
                  methodLabel="AI"
                />
              ) : loadingAi ? (
                <Card>
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
