'use client';

import { cn } from '@/lib/utils';

interface ModeToggleProps {
  mode: 'hint' | 'answer';
  onChange: (mode: 'hint' | 'answer') => void;
}

/**
 * Segmented control for switching between hint and answer mode.
 * Uses aria-current for accessible selected state.
 */
export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground" id="mode-label">
        Mode
      </span>
      <div
        aria-labelledby="mode-label"
        className="flex rounded-lg bg-stone-200 p-1 dark:bg-stone-700"
      >
        {(['hint', 'answer'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-current={mode === value ? 'true' : undefined}
            onClick={() => onChange(value)}
            className={cn(
              'rounded-md py-2 text-sm font-medium transition-colors',
              'min-h-[36px] flex-1 sm:flex-none sm:px-4 sm:w-[72px] text-center',
              'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              'outline-none',
              mode === value
                ? 'bg-primary text-white shadow-sm'
                : 'text-foreground/60 hover:text-foreground hover:bg-stone-300 dark:hover:bg-stone-600'
            )}
          >
            {value === 'hint' ? 'Hint' : 'Answer'}
          </button>
        ))}
      </div>
    </div>
  );
}
