import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export default function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300':
            variant === 'default',
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300':
            variant === 'success',
          'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300':
            variant === 'warning',
          'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300':
            variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}
