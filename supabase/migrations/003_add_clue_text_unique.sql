-- Add UNIQUE constraint on clues.clue_text
-- Required for Supabase upsert with onConflict: 'clue_text'

ALTER TABLE clues ADD CONSTRAINT clues_clue_text_unique UNIQUE (clue_text);
