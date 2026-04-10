"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ClueTypeBadge from "@/components/shared/ClueTypeBadge";
import { CLUE_TYPES } from "@/data/clue-types";
import { cn } from "@/lib/utils";

/**
 * Sidebar/horizontal navigation for browsing clue types on the learn detail pages.
 */
export default function ClueTypeNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Clue types" className="flex flex-col gap-1">
      <Link
        href="/learn"
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "min-h-[44px] flex items-center",
          "hover:bg-stone-100 dark:hover:bg-stone-800",
          pathname === "/learn"
            ? "text-primary bg-primary-light/50"
            : "text-muted"
        )}
      >
        All Types
      </Link>
      {CLUE_TYPES.map((ct) => (
        <Link
          key={ct.slug}
          href={`/learn/${ct.slug}`}
          className={cn(
            "rounded-lg px-3 py-2 text-sm transition-colors",
            "min-h-[44px] flex items-center gap-2",
            "hover:bg-stone-100 dark:hover:bg-stone-800",
            pathname === `/learn/${ct.slug}`
              ? "text-primary bg-primary-light/50 font-medium"
              : "text-muted"
          )}
          aria-current={pathname === `/learn/${ct.slug}` ? "page" : undefined}
        >
          <ClueTypeBadge slug={ct.slug} label={ct.shortCode} />
          <span>{ct.name}</span>
        </Link>
      ))}
    </nav>
  );
}
