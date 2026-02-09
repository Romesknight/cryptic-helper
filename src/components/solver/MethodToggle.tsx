'use client';

import { cn } from '@/lib/utils';
import { useCallback, useRef } from 'react';
import type { SolveMethod } from '@/types/api';

interface MethodToggleProps {
  method: SolveMethod;
  onChange: (method: SolveMethod) => void;
}

const METHODS: { value: SolveMethod; label: string }[] = [
  { value: 'traditional', label: 'Traditional' },
  { value: 'ai', label: 'AI' },
  { value: 'both', label: 'Both' },
];

/**
 * Three-way toggle for selecting the solver method.
 * Uses role="tablist" with keyboard navigation.
 */
export default function MethodToggle({ method, onChange }: MethodToggleProps) {
  const refs = useRef<Map<SolveMethod, HTMLButtonElement | null>>(new Map());

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const currentIndex = METHODS.findIndex((m) => m.value === method);
        const nextIndex =
          e.key === 'ArrowRight'
            ? (currentIndex + 1) % METHODS.length
            : (currentIndex - 1 + METHODS.length) % METHODS.length;
        const next = METHODS[nextIndex].value;
        onChange(next);
        refs.current.get(next)?.focus();
      }
    },
    [method, onChange]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground" id="method-label">
        Solver
      </span>
      <div
        role="tablist"
        aria-labelledby="method-label"
        className="inline-flex rounded-lg border border-border bg-stone-100 p-1 dark:bg-stone-800"
        onKeyDown={handleKeyDown}
      >
        {METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            ref={(el) => {
              refs.current.set(m.value, el);
            }}
            role="tab"
            aria-selected={method === m.value}
            tabIndex={method === m.value ? 0 : -1}
            onClick={() => onChange(m.value)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              'min-h-[44px] min-w-[44px]',
              method === m.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
