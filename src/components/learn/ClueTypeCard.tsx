import Link from "next/link";
import ClueTypeBadge from "@/components/shared/ClueTypeBadge";
import Card from "@/components/ui/Card";
import type { ClueType } from "@/types/clue";

interface ClueTypeCardProps {
  clueType: ClueType;
  exampleClue?: string;
}

/**
 * Card for the learn overview page, showing a clue type with a brief description.
 */
export default function ClueTypeCard({
  clueType,
  exampleClue,
}: ClueTypeCardProps) {
  return (
    <Link href={`/learn/${clueType.slug}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md group-hover:border-primary/30">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <ClueTypeBadge slug={clueType.slug} label={clueType.shortCode} />
            <svg
              className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1"
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
          </div>
          <h3 className="text-lg font-semibold">{clueType.name}</h3>
          <p className="text-sm text-muted line-clamp-2">
            {clueType.description}
          </p>
          {exampleClue && (
            <p className="mt-1 text-sm italic text-muted/80 border-t border-border pt-2">
              &ldquo;{exampleClue}&rdquo;
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
