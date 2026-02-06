import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-muted/30">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/">
          <Button>Go to Solver</Button>
        </Link>
        <Link href="/learn">
          <Button variant="outline">Learn Clue Types</Button>
        </Link>
      </div>
    </div>
  );
}
