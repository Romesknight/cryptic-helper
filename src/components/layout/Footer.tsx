import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col items-center gap-3 text-sm text-muted sm:flex-row sm:justify-between">
          <p>Cryptic Helper &mdash; AI-powered cryptic crossword solver</p>
          <nav aria-label="Footer navigation">
            <ul className="flex gap-4">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Solver
                </Link>
              </li>
              <li>
                <Link
                  href="/learn"
                  className="hover:text-foreground transition-colors"
                >
                  Learn
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mt-3 text-center text-xs text-muted/70">
          Crossword clue data sourced from the{' '}
          <a
            href="https://cryptics.georgeho.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Cryptics Dataset
          </a>
          , made available under the{' '}
          <a
            href="https://opendatacommons.org/licenses/odbl/1-0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Open Database License (ODbL)
          </a>
          . Individual clues are the work of their respective setters and publishers.
        </p>
      </div>
    </footer>
  );
}
