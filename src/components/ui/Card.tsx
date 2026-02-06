import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-border bg-card shadow-sm',
          {
            'p-3': padding === 'sm',
            'p-5': padding === 'md',
            'p-7': padding === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
export default Card;
