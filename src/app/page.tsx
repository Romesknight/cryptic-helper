import Link from "next/link";
import SolverForm from "@/components/solver/SolverForm";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cryptic Crossword Helper
        </h1>
        <p className="mt-3 text-lg text-muted">
          Enter a cryptic clue and get an AI-powered explanation of the
          wordplay. Choose <strong>hint</strong> for a nudge, or{" "}
          <strong>answer</strong> for the full solution with annotation.
        </p>
      </section>

      <SolverForm />

      <section className="mt-10 text-center">
        <p className="text-sm text-muted">
          New to cryptic crosswords?{" "}
          <Link
            href="/learn"
            className="text-primary font-medium hover:underline"
          >
            Learn about the 11 clue types
          </Link>
        </p>
      </section>
    </div>
  );
}
