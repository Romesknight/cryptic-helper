# Cryptic Helper

A dual-engine solver and learning tool for cryptic crossword clues — combining deterministic wordplay algorithms with AI reasoning, and teaching users how clues work along the way.

---

## The Problem

Cryptic crosswords have a loyal but frustrated audience. The clues follow strict logical rules — every word does a job, and the answer is always fully justified — but those rules are almost never explained. New solvers give up because they don't know *why* an answer is right, not just *what* it is. Experienced solvers get stuck on clue types outside their comfort zone.

Existing tools either just hand you the answer (which teaches nothing), or point you at reference books. There's no tool that:
- Meets you where you are (hint vs full answer)
- Explains the wordplay in plain terms
- Tells you honestly when it isn't confident

---

## The Solution

Cryptic Helper takes a clue and a letter pattern, and either guides you toward the answer (hint mode) or reveals and fully annotates it (answer mode). Two solving methods run in parallel or independently:

**Traditional solver** — deterministic, instant, no API cost:
1. Database lookup (known clues with verified annotations)
2. Hidden word scan (finds answers concealed in the clue text)
3. Anagram solver (letter-pattern-aware, false-positive-filtered)

**AI solver** (Groq · llama-3.3-70b-versatile) — handles all clue types including complex hybrids, &lit, and cryptic definitions that rule-based systems can't touch. The prompt is engineered with:
- One worked example per clue type (9 core + hybrid + &lit)
- Explicit disambiguation rules for commonly confused types (container vs hidden word, &lit vs cryptic definition)
- Mandatory letter-count verification before emitting an answer
- Good/bad hint examples so the model knows what "guide without revealing" actually looks like

Running both in **Both mode** shows results side-by-side as they arrive, and cross-validates answers — agreement between solvers boosts AI confidence to high, disagreement caps it at medium.

---

## Key Design Decisions

**Confidence ratings over binary right/wrong.** Cryptic clues are often ambiguous — multiple valid answers can fit a pattern. Showing `high / medium / low` with honest criteria (all three: letter count + wordplay + definition must hold for "high") gives users signal they can act on, rather than false certainty.

**Hint mode is a first-class feature, not an afterthought.** Most solvers jump straight to the answer. Hint mode is designed to keep users in the loop — it names the clue type, identifies the indicator word, and points to the definition without spoiling the answer. This is the mode that actually teaches.

**Traditional solver runs first, AI fills the gaps.** The database lookup is fast and free. Deterministic solvers (hidden word, anagram) are transparent — you can see exactly why they fired. AI is reserved for complex cases where rule-based approaches fail, keeping costs low and latency acceptable.

**Graceful degradation everywhere.** If Supabase isn't configured, the app falls back to a local SQLite database. If the AI returns a malformed response, the system attempts a partial recovery rather than returning a 500. If both solvers fail, the user gets an honest "no match found" rather than a hallucinated answer.

**Annotation as the core value.** The answer alone is trivia. The annotation — showing exactly which word is the indicator, which letters are the fodder, how they combine — is what makes a solver into a learning tool. The annotation notation is standardised: `[square brackets]` for indicators, `**bold**` for answer components, `(parentheses)` for truncation in hidden words, `X around Y` vs `X in Y` for container direction.

---

## Features

| Feature | Detail |
|-|-|
| Hint mode | Clue type + indicator identified, definition surfaced, answer withheld |
| Answer mode | Full annotation with standardised wordplay notation |
| Traditional solver | Database → hidden word → anagram pipeline |
| AI solver | Groq (llama-3.3-70b-versatile) with JSON mode and letter-count enforcement |
| Both mode | Parallel results with cross-validation and incremental rendering |
| Confidence ratings | `high / medium / low` with strict, honest criteria |
| Learn section | Clue type reference with worked examples for all 11 types |
| PWA | Installable, works offline for the learn section |
| Letter pattern extraction | Parses `(8)`, `(4,3)`, `(2-4-2)` from clue text automatically |

**Supported clue types:** Anagram · Hidden Word · Double Definition · Charade · Container · Reversal · Homophone · Deletion · Cryptic Definition · Hybrid · &lit

---

## Architecture

```
Browser
  └── SolverForm (React, client)
        ├── POST /api/solve
        │     ├── Rate limiting (IP-keyed, in-memory)
        │     ├── Input validation (clue, letter pattern, mode, method)
        │     ├── Traditional: solveTraditional()
        │     │     ├── searchDatabase() — Supabase FTS / local SQLite FTS5
        │     │     ├── solveHiddenWord() — word-boundary-aware indicator scan
        │     │     └── solveAnagram() — signature index + pattern filter
        │     └── AI: solveClue() — Groq llama-3.3-70b-versatile
        │           ├── JSON mode (response_format: json_object)
        │           ├── Shared system prompt (prompts.ts)
        │           └── Runtime schema validation (isSolveResponse)
        └── /learn — static clue type reference (SSG)

Database
  ├── Supabase (production) — FTS with websearch, ilike fallback
  └── SQLite / better-sqlite3 (local dev) — FTS5, LIKE ESCAPE fallback
```

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Groq (llama-3.3-70b-versatile) · Anthropic Claude (dormant) · Vitest

---

## Clue Type Coverage

| Type | Traditional | AI |
|-|-|-|
| Anagram | ✓ | ✓ |
| Hidden Word | ✓ | ✓ |
| Double Definition | — | ✓ |
| Charade | — | ✓ |
| Container | — | ✓ |
| Reversal | — | ✓ |
| Homophone | — | ✓ |
| Deletion | — | ✓ |
| Cryptic Definition | — | ✓ |
| Hybrid | — | ✓ |
| &lit | — | ✓ |

The traditional solver intentionally covers only the two most algorithmically tractable types. Everything else requires language understanding that belongs in the AI layer.

---

## How It Got Here — Iterative Development

The full development history is in git. What follows is a walkthrough of the meaningful decisions at each stage — not just what changed, but why.

### v1: AI-only solver with Claude

The first working version was built around Claude (Anthropic's API) with hint and answer modes, a learn section covering the nine core clue types, rate limiting, Supabase schema, and a PWA manifest. The critical early decision was the annotation format: rather than just returning an answer, every solve included a structured breakdown of the wordplay. This is what separates a solver from a lookup tool.

### Verified data over generated data

The initial learn section used AI-generated examples. When reviewed, they contained self-correction artifacts — phrases like "Wait, let me re-examine..." embedded in explanations. All 25 examples were replaced with verified clues sourced from published Times crosswords (Quick Cryptic 3219, Cryptic 29457, Cryptic 29459), with correct letter counts and clean annotations. The lesson: AI-generated training data for an AI-powered learning tool is a quality risk worth catching early.

### Real annotations scraped from crossword blogs

The clue database was populated from eigenfoo, which provided algorithmically-generated indicator-based annotations. These were structurally correct but lacked the human-readable explanation quality of actual crossword commentary. A scraper was built to fetch wordplay explanations from BigDave44, Fifteensquared, Times for the Times, and other source blogs — 771 pages, 1,476 annotations extracted with per-source parsers, rate limiting, and resume support. A post-processing pass cleaned HTML entities, stripped blog commentary, and discarded CSS artifacts. The local database build falls back to generated annotations for clues without a scraped match.

This was an investment in data quality over raw coverage. A smaller set of accurate, human-readable annotations is more useful for a learning tool than a large set of mediocre ones.

### Text normalisation as an invisible correctness fix

A search quality bug was traced to encoding differences between source data and user input — smart quotes, em dashes, and non-breaking spaces from blog content were stored as-is, while user input arrived as plain ASCII. A `normalizeText()` function was applied at both ingestion and query time. Without it, clues pasted from PDFs or word processors would never match their database entries despite being identical to a human reader.

### The traditional solver — and why it matters

Adding a deterministic solver alongside the AI was primarily a transparency decision, not a cost or latency one. When the anagram solver fires, you can see exactly why: the indicator word, the fodder letters, the dictionary match. When the AI solver fires, you get a plausible explanation. These are different things. The traditional solver provides a falsifiable answer; the AI provides a reasoned one.

The pipeline ordering (database → hidden word → anagram) reflects specificity: a database match on a known verified clue is the most trustworthy result; a hidden word match is fully deterministic; an anagram match is high-confidence when unique. The AI fills everything the rule-based pipeline can't handle.

Both mode renders incrementally — the traditional result appears in ~200ms while the AI is still loading. Cross-validation runs when both arrive: agreement boosts AI confidence to high, disagreement caps it at medium. The user sees both sources of signal rather than a single merged answer.

### UX details that earned their place

**Letter pattern auto-extraction.** Users frequently paste complete clues including the letter count: `"Mixed senses in state of uncertainty (8)"`. The API now parses trailing patterns in all common formats — `(8)`, `(3,5)`, `(3, 5)`, `(2-2-2)` — strips them from the clue before solving, and uses them as the filter. The form field became genuinely optional.

**Toggle accessibility.** The mode toggle had a bug: buttons inside a form without `type="button"` default to `type="submit"`, so switching between hint and answer mode triggered a solve. The fix was one attribute, but the consequence was that every toggle interaction had been making an unnecessary API call. Alongside this, the toggle active states were visually ambiguous — low contrast, no weight change — making it unclear which mode was selected. Both were fixed together.

### AI prompt engineering as a distinct feature

The solver prompt went through two significant iterations before the most recent hardening pass.

The first added `howToSpot` guidance per clue type and nine few-shot worked examples drawn directly from the verified data layer. This gave the model concrete patterns rather than abstract descriptions, and added explicit confidence calibration criteria defaulting to "medium" unless all three conditions (letter count, wordplay, definition) could be independently verified.

The second addressed database false positives. A Jaccard word-overlap score was added between input clue and any database match, requiring at least two meaningful non-stop-word matches. Confidence is adjusted downward based on match quality — a weak match that passes the filter still gets `low` rather than inheriting the stored `high`. This prevented the database from confidently returning irrelevant clues that shared one word with the input.

### Solver bugs, AI failures, and security — addressed together before going public

A review pass before making the repository public found issues across three areas.

**Solver correctness.** The hidden word solver matched indicators inside longer words — `"in"` firing on `"interesting"` — causing false positives that preempted the anagram solver. The anagram solver pushed single-letter fodder candidates when no letter pattern was provided, flooding results with noise. Both bugs were in completely untested code. Tests for the specific failure modes were added alongside the fixes.

**AI quality.** Three root causes explained most failures. No schema enforcement: returning valid JSON but wrong shape caused silent validation failures. Fix: runtime `isSolveResponse` guard validates the discriminated union after parsing. Letter pattern was advisory not mandatory — the model could report high confidence on a wrong-length answer. Fix: the user prompt now computes and states the total letter count explicitly with a mandatory reject-and-retry instruction. All nine few-shot examples showed answer mode — the model had never seen a correct hint response. Fix: a good hint example plus three explicitly labelled bad examples (reveals answer, too vague, returns wrong field).

**Two new clue types.** Hybrid clues (combined mechanisms) and &lit clues (whole clue is simultaneously definition and wordplay) were absent from the type system. Adding them required a consistent compact notation (`WORD*` for anagram, `WORD<` for reversal, `X around Y` vs `X in Y` for container direction based on which way the indicator points) and worked examples in both the data layer and the prompt. The notation system is a product decision: consistent annotation format makes the AI's output learnable rather than just plausible.

**Security.** Credentials had leaked into a comment in `.env.local`. The rate limiter was keyed on `x-forwarded-for`, which clients can spoof — Vercel's `x-vercel-forwarded-for` is edge-set and can't be. `letterPattern` had no server-side validation despite a validator already existing in utils. The `method` field silently coerced unknown values rather than rejecting them. No HTTP security headers were set. None were individually severe; together they represented a surface that hadn't been reviewed for public traffic yet.

---

## Known Limitations & Future Directions

**Rate limiting** is in-memory and per-process. On Vercel's serverless infrastructure each function instance has its own counter, so effective rate is limit × instance count. Production enforcement needs a shared store (Upstash Redis + `@upstash/ratelimit`).

**Anagram and hidden word solvers** work from a static word list. Proper nouns, plurals, and conjugated forms that aren't in the list won't be found. A larger dictionary or morphological expansion would improve recall.

**No user accounts or history.** Clues aren't saved, corrections can't be submitted. A feedback loop — letting users flag wrong answers — would improve the database over time and give signal for prompt refinement.

**AI confidence is self-reported.** The model assesses its own confidence, which is better than nothing but not calibrated. A validation pass comparing AI answers against the database (already partially done via cross-validation in Both mode) could produce more reliable confidence scores.

**AI solver accuracy is limited by the open model.** Groq's free tier uses `llama-3.3-70b-versatile`, which is capable but not frontier-class. It pattern-matches to plausible answers rather than verifying wordplay letter-by-letter. Upgrading to Claude or GPT-4 class models would improve accuracy, at cost. The Claude client is dormant but ready — swapping the backend is a one-line change in `route.ts`.

---

## Development

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)

# Database
npm run db:build-local   # Build local SQLite DB for offline dev
npm run db:import        # Import clue dataset to Supabase
npm run db:seed          # Seed clues to Supabase
```

Copy `.env.example` to `.env.local` and fill in your keys. The app works without Supabase — it falls back to the local SQLite database built by `db:build-local`.
