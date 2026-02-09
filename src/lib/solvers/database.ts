import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SolveAnswerResponse } from '@/types/api';

interface DatabaseResult {
  answer: string;
  clueType: string;
  clueTypeLabel: string;
  annotation: string;
  definition: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'database';
}

/**
 * Search the Supabase clues table for matching clue text.
 * Uses full-text search when available, falls back to ILIKE.
 */
export async function searchDatabase(
  clueText: string,
  letterPattern?: string
): Promise<DatabaseResult[]> {
  try {
    const supabase = await createServerSupabaseClient();

    // Clean clue text for search
    const cleanClue = clueText.replace(/\(\d+(?:,\d+)*\)\s*$/, '').trim();

    // Try full-text search first
    let query = supabase
      .from('clues')
      .select(
        `
        answer,
        clue_type_id,
        annotation,
        definition_part,
        difficulty,
        is_verified,
        clue_types!inner(name, slug)
      `
      )
      .textSearch('clue_text', cleanClue, {
        type: 'websearch',
        config: 'english',
      })
      .eq('is_verified', true)
      .limit(5);

    // Filter by letter pattern if provided
    if (letterPattern) {
      const pattern = letterPattern.replace(/[^0-9,]/g, '');
      if (pattern) {
        query = query.eq('letter_pattern', pattern);
      }
    }

    const { data, error } = await query;

    if (error) {
      // Full-text search might not be set up — fall back to ILIKE
      const fallbackQuery = supabase
        .from('clues')
        .select(
          `
          answer,
          clue_type_id,
          annotation,
          definition_part,
          difficulty,
          is_verified,
          clue_types!inner(name, slug)
        `
        )
        .ilike('clue_text', `%${cleanClue}%`)
        .eq('is_verified', true)
        .limit(5);

      const { data: fallbackData, error: fallbackError } =
        await fallbackQuery;

      if (fallbackError || !fallbackData?.length) return [];

      return mapResults(fallbackData);
    }

    if (!data?.length) return [];

    return mapResults(data);
  } catch {
    // Database not available — return empty
    return [];
  }
}

/**
 * Map raw Supabase rows to DatabaseResult objects.
 */
function mapResults(rows: Record<string, unknown>[]): DatabaseResult[] {
  return rows.map((row) => {
    const clueTypes = row.clue_types as
      | { name: string; slug: string }
      | undefined;
    return {
      answer: (row.answer as string) ?? '',
      clueType: clueTypes?.slug ?? 'unknown',
      clueTypeLabel: clueTypes?.name ?? 'Unknown',
      annotation: (row.annotation as string) ?? '',
      definition: (row.definition_part as string) ?? '',
      confidence: (row.is_verified as boolean) ? 'high' : 'medium',
      source: 'database' as const,
    };
  });
}
