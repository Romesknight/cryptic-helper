# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode

# Database scripts (require tsx)
npm run db:import    # Import eigenfoo clue dataset into Supabase
npm run db:seed      # Seed clues into Supabase
npm run db:build-local  # Build local SQLite DB at scripts/data/clues-local.db
```

To run a single test file: `npx vitest run src/lib/rate-limit.test.ts`

## Environment Variables

```
ANTHROPIC_API_KEY           # Claude AI solver (src/lib/claude/client.ts)
GOOGLE_GEMINI_API_KEY       # Gemini AI solver — primary AI backend (src/lib/gemini/client.ts)
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
```

When Supabase vars are missing or set to placeholder values, the database solver automatically falls back to the local SQLite file at `scripts/data/clues-local.db`.

## Architecture

**Next.js 16 App Router** with TypeScript and Tailwind CSS v4.

### Solving Pipeline

The core feature is `POST /api/solve`. It accepts `{ clue, letterPattern, mode, method }` and supports three methods:

- **`traditional`** — `src/lib/solvers/index.ts`: runs database → hidden-word → anagram in sequence, returning on the first confident match.
- **`ai`** — calls Gemini (`src/lib/gemini/client.ts`). Despite the `src/lib/claude/` directory existing, **Gemini is the active AI solver**. The Claude client is wired up but not called by the solve route.
- **`both`** — runs traditional and AI in parallel via `Promise.allSettled`, returns an array of `SolveResultWithMethod`.

**Modes:** `hint` returns a descriptive hint string; `answer` returns the full answer with annotation.

### Database Layer (`src/lib/solvers/database.ts`)

- **Supabase** (production): full-text search with `textSearch`, fallback to `ilike`.
- **Local SQLite** (dev): `better-sqlite3` with FTS5, fallback to `LIKE`. File: `scripts/data/clues-local.db`.
- Results are filtered with Jaccard word-overlap similarity (`clueMatchScore`, `MIN_MATCH_SCORE = 0.4`) to prevent false positives from short-clue matches.

### AI Prompts (`src/lib/claude/prompts.ts`)

Both Claude and Gemini clients share the same system prompt and `buildUserPrompt`. The response must be valid JSON matching `SolveResponse` (discriminated union: has `answer` XOR `hint`).

### Rate Limiting (`src/lib/rate-limit.ts`)

In-memory, per-process. Not suitable for multi-instance deployments — replace with Redis if scaling horizontally.

### Types (`src/types/`)

- `SolveResponse` = `SolveAnswerResponse | SolveHintResponse` (discriminated by presence of `answer` vs `hint`)
- `SolveMethod` = `'traditional' | 'ai' | 'both'`

### Component Structure

- `src/components/ui/` — primitive components (Button, Card, Input, Badge, Skeleton)
- `src/components/solver/` — solver UI (SolverForm, ModeToggle, MethodToggle, AnnotatedClue)
- `src/components/learn/` — educational clue-type pages
- `src/components/layout/` — Header, Footer
- `src/components/shared/` — shared utilities (ClueTypeBadge, PWAInstallPrompt, SkipToContent)

### Data

- `src/data/clue-types.ts` — static definitions of cryptic clue types (anagram, hidden word, etc.)
- `src/data/words.json` — word list used by the anagram solver
