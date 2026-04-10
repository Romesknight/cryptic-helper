"use client";

import { cn } from "@/lib/utils";
import type { SolveMethod } from "@/types/api";

interface MethodToggleProps {
  method: SolveMethod;
  onChange: (method: SolveMethod) => void;
}

const METHODS: { value: SolveMethod; label: string; shortLabel: string }[] = [
  { value: "traditional", label: "Traditional", shortLabel: "Trad." },
  { value: "ai", label: "AI", shortLabel: "AI" },
  { value: "both", label: "Both", shortLabel: "Both" },
];

/**
 * Three-way segmented control for selecting the solver method.
 * Uses aria-current for accessible selected state.
 */
export default function MethodToggle({ method, onChange }: MethodToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground" id="method-label">
        Solver
      </span>
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-labelledby is valid on this grouping div */}
      <div
        aria-labelledby="method-label"
        className="flex rounded-lg bg-stone-200 p-1 dark:bg-stone-700"
      >
        {METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-current={method === m.value ? "true" : undefined}
            onClick={() => onChange(m.value)}
            className={cn(
              "rounded-md py-2 text-sm font-medium transition-colors",
              "min-h-[36px] flex-1 sm:flex-none sm:px-3 sm:min-w-[52px] text-center",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              "outline-none",
              method === m.value
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/60 hover:text-foreground hover:bg-stone-300 dark:hover:bg-stone-600"
            )}
          >
            <span className="sm:hidden">{m.shortLabel}</span>
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
