'use client';

import { cn } from '@/lib/utils';
import { useCallback, useRef } from 'react';

interface ModeToggleProps {
  mode: 'hint' | 'answer';
  onChange: (mode: 'hint' | 'answer') => void;
}

/**
 * Segmented control for switching between hint and answer mode.
 * Uses role="tablist" with keyboard navigation.
 */
export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const hintRef = useRef<HTMLButtonElement>(null);
  const answerRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = mode === 'hint' ? 'answer' : 'hint';
        onChange(next);
        // Focus the newly selected tab
        if (next === 'hint') {
          hintRef.current?.focus();
        } else {
          answerRef.current?.focus();
        }
      }
    },
    [mode, onChange]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground" id="mode-label">
        Mode
      </span>
      <div
        role="tablist"
        aria-labelledby="mode-label"
        className="inline-flex rounded-lg border border-border bg-stone-100 p-1 dark:bg-stone-800"
        onKeyDown={handleKeyDown}
      >
        <button
          ref={hintRef}
          role="tab"
          aria-selected={mode === 'hint'}
          tabIndex={mode === 'hint' ? 0 : -1}
          onClick={() => onChange('hint')}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'min-h-[44px] min-w-[44px]',
            mode === 'hint'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          )}
        >
          Hint
        </button>
        <button
          ref={answerRef}
          role="tab"
          aria-selected={mode === 'answer'}
          tabIndex={mode === 'answer' ? 0 : -1}
          onClick={() => onChange('answer')}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'min-h-[44px] min-w-[44px]',
            mode === 'answer'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          )}
        >
          Answer
        </button>
      </div>
    </div>
  );
}
