import Groq from "groq-sdk";
import type { SolveAnswerResponse, SolveResponse } from "@/types/api";
import { isSolveResponse, VALID_CLUE_TYPE_SLUGS } from "@/types/api";
import { buildUserPrompt, SYSTEM_PROMPT } from "../claude/prompts";

let groq: Groq | null = null;

function getClient(): Groq {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    groq = new Groq({ apiKey });
  }
  return groq;
}

function isValidSolveResponse(obj: unknown): obj is SolveResponse {
  if (!isSolveResponse(obj)) return false;
  const o = obj as unknown as Record<string, unknown>;
  return VALID_CLUE_TYPE_SLUGS.has(o.clueType as string);
}

const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] as const;

/**
 * Send a cryptic crossword clue to Groq for analysis.
 * Tries llama-3.3-70b-versatile first; falls back to llama-3.1-8b-instant on overload.
 */
export async function solveClue(
  clue: string,
  mode: "hint" | "answer",
  letterPattern?: string
): Promise<SolveResponse> {
  const client = getClient();
  const userPrompt = buildUserPrompt(clue, mode, letterPattern);

  let lastError: unknown;
  for (const model of MODELS) {
    try {
      return await callGroq(client, model, userPrompt, mode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("503") ||
        msg.includes("overloaded") ||
        msg.includes("rate_limit") ||
        msg.includes("429")
      ) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error("All Groq models unavailable");
}

async function callGroq(
  client: Groq,
  model: string,
  userPrompt: string,
  mode: "hint" | "answer"
): Promise<SolveResponse> {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
    temperature: 0.1,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No text response from Groq");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Groq returned invalid JSON");
  }

  if (!isValidSolveResponse(parsed)) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[groq] Schema validation failed. Raw response:", text);
    }
    const p = parsed as Record<string, unknown>;
    if (
      mode === "answer" &&
      typeof p?.answer === "string" &&
      p.answer.length > 0
    ) {
      return {
        answer: (p.answer as string).toUpperCase(),
        clueType: "unknown",
        clueTypeLabel: "Unknown",
        annotation:
          typeof p.annotation === "string"
            ? p.annotation
            : "(annotation unavailable)",
        definition: typeof p.definition === "string" ? p.definition : "",
        confidence: "low",
      } satisfies SolveAnswerResponse;
    }
    throw new Error("Groq response does not match expected schema");
  }

  return parsed;
}
