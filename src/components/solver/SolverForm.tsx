'use client';

import { useState, useCallback } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import ModeToggle from './ModeToggle';
import AnnotatedClue from './AnnotatedClue';
import type { SolveResponse, SolveAnswerResponse, SolveHintResponse } from '@/types/api';

function isAnswerResponse(r: SolveResponse): r is SolveAnswerResponse {
  return 'answer' in r;
}

function isHintResponse(r: SolveResponse): r is SolveHintResponse {
  return 'hint' in r;
}

export default function SolverForm() {
  const [clue, setClue] = useState('');
  const [letterPattern, setLetterPattern] = useState('');
  const [mode, setMode] = useState<'hint' | 'answer'>('hint');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!clue.trim()) return;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch('/api/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clue: clue.trim(),
            letterPattern: letterPattern.trim() || undefined,
            mode,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Something went wrong');
          return;
        }

        setResult(data);
      } catch {
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [clue, letterPattern, mode]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Cryptic clue"
            placeholder='e.g. "Crazy leader is more dangerous (8)"'
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            maxLength={500}
            required
            autoFocus
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Letter pattern (optional)"
                placeholder="e.g. 8 or 4,3"
                value={letterPattern}
                onChange={(e) => setLetterPattern(e.target.value)}
                helpText="Number of letters, e.g. 7 or 4,3 for two words"
              />
            </div>
            <ModeToggle mode={mode} onChange={setMode} />
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
        {loading && (
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

        {result && !loading && (
          <Card>
            <div className="flex flex-col gap-4">
              {/* Clue type badge */}
              <div className="flex items-center gap-2">
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
                  <h3 className="text-sm font-medium text-muted mb-1">
                    Answer
                  </h3>
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
                <h3 className="text-sm font-medium text-muted mb-1">
                  Definition
                </h3>
                <p className="text-base italic">&ldquo;{result.definition}&rdquo;</p>
              </div>

              {/* Annotation (answer mode only) */}
              {isAnswerResponse(result) && (
                <div>
                  <h3 className="text-sm font-medium text-muted mb-1">
                    Annotation
                  </h3>
                  <AnnotatedClue
                    annotation={result.annotation}
                    className="text-base leading-relaxed"
                  />
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
