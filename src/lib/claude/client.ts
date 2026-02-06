import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import type { SolveResponse } from '@/types/api';

let client: Anthropic | null = null;

/**
 * Get or create the Anthropic client singleton.
 */
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Send a cryptic crossword clue to Claude for analysis.
 */
export async function solveClue(
  clue: string,
  mode: 'hint' | 'answer',
  letterPattern?: string
): Promise<SolveResponse> {
  const anthropic = getClient();
  const userPrompt = buildUserPrompt(clue, mode, letterPattern);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = JSON.parse(textBlock.text) as SolveResponse;
  return parsed;
}
