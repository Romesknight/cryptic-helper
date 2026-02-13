import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, buildUserPrompt } from '../claude/prompts';
import type { SolveResponse } from '@/types/api';

let ai: GoogleGenAI | null = null;

/**
 * Validate that a parsed object matches the SolveResponse discriminated union.
 */
function isSolveResponse(obj: unknown): obj is SolveResponse {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;

  // Common required fields
  if (typeof o.clueType !== 'string' || typeof o.clueTypeLabel !== 'string') return false;
  if (typeof o.definition !== 'string') return false;
  if (!['high', 'medium', 'low'].includes(o.confidence as string)) return false;

  // Discriminated union: must have answer XOR hint
  const hasAnswer = typeof o.answer === 'string';
  const hasHint = typeof o.hint === 'string';

  if (hasAnswer && !hasHint) {
    return typeof o.annotation === 'string'; // SolveAnswerResponse
  }
  if (hasHint && !hasAnswer) {
    return true; // SolveHintResponse
  }
  return false; // has both or neither
}

/**
 * Get or create the Google GenAI client singleton.
 */
function getClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
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
  mode: 'hint' | 'answer',
  letterPattern?: string
): Promise<SolveResponse> {
  const client = getClient();
  const userPrompt = buildUserPrompt(clue, mode, letterPattern);

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text response from Gemini');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini returned invalid JSON');
  }
  if (!isSolveResponse(parsed)) {
    throw new Error('Gemini response does not match expected schema');
  }
  return parsed;
}
