import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  Type,
} from "@google/genai";
import type { SolveAnswerResponse, SolveResponse } from "@/types/api";
import { isSolveResponse, VALID_CLUE_TYPE_SLUGS } from "@/types/api";
import { buildUserPrompt, SYSTEM_PROMPT } from "../claude/prompts";

let ai: GoogleGenAI | null = null;

// JSON schemas passed to Gemini to enforce the discriminated union at the API level.
// This eliminates structural failures (wrong shape, missing fields, bad enum values)
// before our own isSolveResponse guard runs.
const BASE_SCHEMA_PROPS = {
  clueType: { type: Type.STRING },
  clueTypeLabel: { type: Type.STRING },
  definition: { type: Type.STRING },
  confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
};

const ANSWER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ...BASE_SCHEMA_PROPS,
    answer: { type: Type.STRING },
    annotation: { type: Type.STRING },
  },
  required: [
    "answer",
    "clueType",
    "clueTypeLabel",
    "annotation",
    "definition",
    "confidence",
  ],
};

const HINT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ...BASE_SCHEMA_PROPS,
    hint: { type: Type.STRING },
  },
  required: ["hint", "clueType", "clueTypeLabel", "definition", "confidence"],
};

/**
 * Validate that a parsed object matches the SolveResponse discriminated union,
 * and that the clueType slug is one of the known canonical values.
 */
function isValidSolveResponse(obj: unknown): obj is SolveResponse {
  if (!isSolveResponse(obj)) return false;
  const o = obj as unknown as Record<string, unknown>;
  return VALID_CLUE_TYPE_SLUGS.has(o.clueType as string);
}

/**
 * Get or create the Google GenAI client singleton.
 */
function getClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Send a cryptic crossword clue to Gemini for analysis.
 */
export async function solveClue(
  clue: string,
  mode: "hint" | "answer",
  letterPattern?: string
): Promise<SolveResponse> {
  const client = getClient();
  const userPrompt = buildUserPrompt(clue, mode, letterPattern);

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: mode === "answer" ? ANSWER_SCHEMA : HINT_SCHEMA,
      // Cryptic crosswords legitimately reference drugs, weapons, violence, etc.
      // as wordplay fodder — lower thresholds to avoid false positives.
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    },
  });

  // Detect safety filter block before accessing response text
  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === "SAFETY") {
    throw new Error("SAFETY_BLOCKED");
  }

  let text: string | undefined;
  try {
    text = response.text;
  } catch {
    throw new Error("SAFETY_BLOCKED");
  }
  if (!text) {
    throw new Error("No text response from Gemini");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }

  if (!isValidSolveResponse(parsed)) {
    // Attempt graceful recovery for answer mode before throwing
    if (process.env.NODE_ENV !== "production") {
      console.error("[gemini] Schema validation failed. Raw response:", text);
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
    throw new Error("Gemini response does not match expected schema");
  }

  return parsed;
}
