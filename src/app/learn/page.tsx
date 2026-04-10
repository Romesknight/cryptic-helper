import type { Metadata } from "next";
import ClueTypeCard from "@/components/learn/ClueTypeCard";
import { CLUE_EXAMPLES, CLUE_TYPES } from "@/data/clue-types";

export const metadata: Metadata = {
  title: "Learn Cryptic Clue Types",
  description:
    "Master the 9 types of cryptic crossword clue: anagrams, hidden words, double definitions, charades, containers, reversals, homophones, deletions, and cryptic definitions.",
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Learn Cryptic Clue Types
        </h1>
        <p className="mt-3 text-lg text-muted">
          Every cryptic crossword clue falls into one of 9 categories. Each type
          uses a different kind of wordplay. Learn to recognise them and
          you&apos;ll crack clues much faster.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CLUE_TYPES.map((ct) => {
          const example = CLUE_EXAMPLES.find(
            (ex) => ex.clueTypeSlug === ct.slug
          );
          return (
            <ClueTypeCard
              key={ct.slug}
              clueType={ct}
              exampleClue={example?.clueText}
            />
          );
        })}
      </div>
    </div>
  );
}
