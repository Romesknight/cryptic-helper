export type SolveMethod = "traditional" | "ai" | "both";

/**
 * Valid clue type slugs. Must stay in sync with CLUE_TYPES in src/data/clue-types.ts.
 * 'unknown' is reserved for cases where the type cannot be determined.
 */
export const VALID_CLUE_TYPE_SLUGS = new Set([
  "anagram",
  "hidden-word",
  "double-definition",
  "charade",
  "container",
  "reversal",
  "homophone",
  "deletion",
  "cryptic-definition",
  "hybrid",
  "and-lit",
  "unknown",
]);

/**
 * Runtime type guard for SolveResponse.
 * TypeScript types are erased at runtime — this validates the actual shape
 * of JSON returned by AI models before trusting it.
 */
export function isSolveResponse(obj: unknown): obj is SolveResponse {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;

  if (typeof o.clueType !== "string") return false;
  if (typeof o.clueTypeLabel !== "string") return false;
  if (typeof o.definition !== "string") return false;
  if (!["high", "medium", "low"].includes(o.confidence as string)) return false;

  const hasAnswer = typeof o.answer === "string" && o.answer.length > 0;
  const hasHint = typeof o.hint === "string" && o.hint.length > 0;

  if (hasAnswer && !hasHint) {
    return typeof o.annotation === "string";
  }
  if (hasHint && !hasAnswer) {
    return true;
  }
  return false;
}

export interface SolveRequest {
  clue: string;
  letterPattern?: string;
  mode: "hint" | "answer";
  method?: SolveMethod;
}

export interface SolveAnswerResponse {
  answer: string;
  clueType: string;
  clueTypeLabel: string;
  annotation: string;
  definition: string;
  confidence: "high" | "medium" | "low";
}

export interface SolveHintResponse {
  hint: string;
  clueType: string;
  clueTypeLabel: string;
  definition: string;
  confidence: "high" | "medium" | "low";
}

export type SolveResponse = SolveAnswerResponse | SolveHintResponse;

export interface SolveResultWithMethod {
  method: "traditional" | "ai";
  result: SolveResponse;
}

export interface ApiError {
  error: string;
  code?: string;
}
