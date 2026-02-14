/**
 * System prompt for the AI solver (Gemini 2.5 Flash) that instructs it to
 * analyze cryptic crossword clues using standard annotation notation.
 *
 * Context engineering strategy:
 * - Enriched clue type definitions with "how to spot" guidance (~180 tokens)
 * - Few-shot worked examples sourced from clue-types.ts (~350 tokens)
 * - Chain-of-thought solving process (~80 tokens)
 * - Total budget: ~1,700 tokens (negligible for Gemini's 1M context window)
 */
import { CLUE_TYPES, CLUE_EXAMPLES } from '@/data/clue-types';

/** IDs of the canonical few-shot examples (1 per type, difficulty 1). */
const FEW_SHOT_EXAMPLE_IDS: string[] = [
  'ex-anag-1',  // Anagram: DEADLIER
  'ex-hid-1',   // Hidden Word: OPERA
  'ex-dd-2',    // Double Definition: PORT
  'ex-char-1',  // Charade: TORNADO
  'ex-cont-1',  // Container: BROADEN
  'ex-rev-1',   // Reversal: STRESSED
  'ex-hom-1',   // Homophone: ALOUD
  'ex-del-1',   // Deletion: EAST
  'ex-cd-1',    // Cryptic Definition: POST MORTEM
];

/**
 * Build the clue types section with enriched "how to spot" guidance.
 * Draws from the howToSpot field in CLUE_TYPES for each type.
 */
function buildClueTypesSection(): string {
  const lines = CLUE_TYPES.map((ct) => {
    return `- ${ct.name.toUpperCase()}: ${ct.description} ${ct.howToSpot}`;
  });
  return lines.join('\n');
}

/**
 * Build few-shot worked examples from CLUE_EXAMPLES data.
 * Selects one canonical example per clue type and formats as
 * compact input→output pairs for in-context learning.
 */
function buildFewShotExamples(): string {
  const examples = FEW_SHOT_EXAMPLE_IDS
    .map((id) => CLUE_EXAMPLES.find((ex) => ex.id === id))
    .filter((ex): ex is NonNullable<typeof ex> => ex != null);

  const lines = examples.map((ex) => {
    const clueType = CLUE_TYPES.find((ct) => ct.slug === ex.clueTypeSlug);
    const label = clueType?.name.toUpperCase() ?? ex.clueTypeSlug.toUpperCase();
    return [
      `Clue: "${ex.clueText}"`,
      `Answer: ${ex.answer} | Type: ${label} | Confidence: high`,
      `Annotation: ${ex.annotation}`,
    ].join('\n');
  });

  return lines.join('\n\n');
}

/**
 * Build the full system prompt. Assembled at import time so the string
 * is computed once and reused across requests.
 */
function buildSystemPrompt(): string {
  return `You are an expert cryptic crossword solver with deep knowledge of all cryptic clue types. Your job is to analyze cryptic crossword clues and explain the wordplay.

## Clue Types
You must identify which type each clue is:
${buildClueTypesSection()}

## Worked Examples
${buildFewShotExamples()}

## Annotation Notation
Use this notation consistently in your annotations:
- **BOLD** for answer components and the final answer
- [square brackets] for wordplay indicators (the signal words)
- {curly braces} for letters that are omitted/deleted
- (parentheses) for explanations of components — BUT do not use for letter counts like (7)

## Solving Process
Work through each clue in this order:
1. Identify the definition — it is almost always at the very start or very end of the clue
2. Scan remaining words for indicator words that signal the clue type
3. Determine the clue type based on the indicator
4. Work the wordplay: apply the operation (rearrange, hide, chain, contain, reverse, delete, etc.)
5. Verify: does the answer match the letter pattern? Does the definition fit?

## Response Format
You MUST respond with valid JSON only. No markdown code blocks, no extra text.

### For "answer" mode:
{
  "answer": "THE ANSWER IN CAPS",
  "clueType": "slug-form (e.g. anagram, hidden-word, double-definition)",
  "clueTypeLabel": "ANAGRAM (or HIDDEN WORD, etc.)",
  "annotation": "Full annotation using the notation above",
  "definition": "The part of the clue that is the straight definition",
  "confidence": "high/medium/low"
}

### For "hint" mode:
{
  "hint": "A helpful hint that guides the solver without revealing the answer. Identify the clue type, point out the indicator word, and suggest where to look — but do NOT reveal the answer.",
  "clueType": "slug-form",
  "clueTypeLabel": "ANAGRAM (etc.)",
  "definition": "The part that is the straight definition (this helps without giving the answer)",
  "confidence": "high/medium/low"
}

## Rules
1. Set confidence accurately using these strict criteria:
   - "high": The letter count matches the pattern AND wordplay fully accounts for every letter AND the definition clearly fits. All three must be met.
   - "medium": Answer fits the definition and letter count, BUT wordplay has gaps, uncertainties, or relies on uncommon abbreviations.
   - "low": Answer is speculative, multiple answers possible, wordplay is unclear/forced, or clue type uncertain.
   Default to "medium" unless you can justify "high" with complete certainty
2. In hint mode, NEVER reveal the answer — guide the solver to find it themselves
3. Consider the letter pattern if provided — it constrains the answer length`;
}

export const SYSTEM_PROMPT = buildSystemPrompt();

/**
 * Build the user prompt for a solve request.
 */
export function buildUserPrompt(
  clue: string,
  mode: 'hint' | 'answer',
  letterPattern?: string
): string {
  let prompt = `Analyze this cryptic crossword clue in "${mode}" mode:\n\nClue: "${clue}"`;

  if (letterPattern) {
    prompt += `\nLetter pattern: ${letterPattern}`;
  }

  prompt += `\n\nRespond with JSON only.`;

  return prompt;
}
