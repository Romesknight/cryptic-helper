'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import AnnotatedClue from '@/components/solver/AnnotatedClue';
import type { ClueExample } from '@/types/clue';
import { DIFFICULTY_LABELS } from '@/lib/constants';

interface ExampleClueProps {
  example: ClueExample;
}

/**
 * An example clue with reveal/hide functionality.
 */
export default function ExampleClue({ example }: ExampleClueProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-medium">
          &ldquo;{example.clueText}&rdquo;
        </p>
        <Badge>
          {DIFFICULTY_LABELS[example.difficulty]}
        </Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setRevealed(!revealed)}
        aria-expanded={revealed}
        aria-controls={`example-${example.id}`}
      >
        {revealed ? 'Hide' : 'Reveal'} Answer
      </Button>

      {revealed && (
        <div id={`example-${example.id}`} className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="text-lg font-bold font-mono tracking-wider text-primary">
            {example.answer}
          </p>
          <AnnotatedClue
            annotation={example.annotation}
            className="text-sm leading-relaxed"
          />
          <p className="text-sm text-muted">{example.explanation}</p>
        </div>
      )}
    </Card>
  );
}
