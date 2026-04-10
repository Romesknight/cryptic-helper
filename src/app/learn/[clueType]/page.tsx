import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClueTypeNav from "@/components/learn/ClueTypeNav";
import ExampleClue from "@/components/learn/ExampleClue";
import ClueTypeBadge from "@/components/shared/ClueTypeBadge";
import {
  CLUE_TYPES,
  getClueTypeBySlug,
  getExamplesForType,
} from "@/data/clue-types";

interface PageProps {
  params: Promise<{ clueType: string }>;
}

/**
 * Generate static paths for all 11 clue types.
 */
export function generateStaticParams() {
  return CLUE_TYPES.map((ct) => ({ clueType: ct.slug }));
}

/**
 * Generate metadata for each clue type page.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { clueType: slug } = await params;
  const clueType = getClueTypeBySlug(slug);

  if (!clueType) {
    return { title: "Clue Type Not Found" };
  }

  return {
    title: `${clueType.name} Clues`,
    description: clueType.description,
  };
}

export default async function ClueTypeDetailPage({ params }: PageProps) {
  const { clueType: slug } = await params;
  const clueType = getClueTypeBySlug(slug);

  if (!clueType) {
    notFound();
  }

  const examples = getExamplesForType(slug);

  // Find prev/next clue types for navigation
  const currentIndex = CLUE_TYPES.findIndex((ct) => ct.slug === slug);
  const prev = currentIndex > 0 ? CLUE_TYPES[currentIndex - 1] : null;
  const next =
    currentIndex < CLUE_TYPES.length - 1 ? CLUE_TYPES[currentIndex + 1] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar nav (desktop only) */}
        <aside className="hidden lg:block lg:w-56 lg:shrink-0">
          <div className="sticky top-20">
            <ClueTypeNav />
          </div>
        </aside>

        {/* Main content */}
        <article className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-muted">
              <li>
                <Link
                  href="/learn"
                  className="hover:text-foreground transition-colors"
                >
                  Learn
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-foreground">{clueType.name}</li>
            </ol>
          </nav>

          <header className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <ClueTypeBadge slug={clueType.slug} label={clueType.shortCode} />
              <h1 className="text-2xl font-bold sm:text-3xl">
                {clueType.name}
              </h1>
            </div>
            <p className="text-lg text-muted leading-relaxed">
              {clueType.description}
            </p>
          </header>

          {/* How to spot */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">How to Spot</h2>
            <p className="text-base leading-relaxed">{clueType.howToSpot}</p>
          </section>

          {/* Common indicators */}
          {clueType.commonIndicators.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Common Indicators</h2>
              <div className="flex flex-wrap gap-2">
                {clueType.commonIndicators.map((indicator) => (
                  <span
                    key={indicator}
                    className="inline-flex rounded-md border border-border bg-stone-50 px-2.5 py-1 text-sm dark:bg-stone-800"
                  >
                    {indicator}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Examples */}
          {examples.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Examples</h2>
              <div className="flex flex-col gap-3">
                {examples.map((example) => (
                  <ExampleClue key={example.id} example={example} />
                ))}
              </div>
            </section>
          )}

          {/* Prev/Next navigation */}
          <nav
            aria-label="Previous and next clue types"
            className="flex justify-between border-t border-border pt-6"
          >
            {prev ? (
              <Link
                href={`/learn/${prev.slug}`}
                className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {prev.name}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/learn/${next.slug}`}
                className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1"
              >
                {next.name}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
