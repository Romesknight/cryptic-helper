import { CLUE_TYPE_COLORS } from '@/lib/constants';
import type { ClueTypeName } from '@/types/clue';
import { cn } from '@/lib/utils';

interface ClueTypeBadgeProps {
  slug: ClueTypeName;
  label: string;
  className?: string;
}

/**
 * A colored badge for displaying a clue type.
 */
export default function ClueTypeBadge({ slug, label, className }: ClueTypeBadgeProps) {
  const colors = CLUE_TYPE_COLORS[slug];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {label}
    </span>
  );
}
