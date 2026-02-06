'use client';

import Button from '@/components/ui/Button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
