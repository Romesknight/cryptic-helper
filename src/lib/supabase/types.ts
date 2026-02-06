/**
 * Supabase database schema types.
 * These match the SQL migration tables.
 */
export interface Database {
  public: {
    Tables: {
      clue_types: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_code: string;
          description: string;
          how_to_spot: string;
          common_indicators: string[];
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clue_types']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['clue_types']['Insert']>;
      };
      clues: {
        Row: {
          id: string;
          clue_text: string;
          answer: string;
          letter_pattern: string;
          clue_type_id: string;
          annotation: string;
          definition_part: string;
          wordplay_part: string;
          difficulty: number;
          source: string | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clues']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['clues']['Insert']>;
      };
      clue_examples: {
        Row: {
          id: string;
          clue_text: string;
          answer: string;
          letter_pattern: string;
          clue_type_id: string;
          annotation: string;
          annotation_html: string | null;
          explanation: string;
          difficulty: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clue_examples']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['clue_examples']['Insert']>;
      };
    };
  };
}
