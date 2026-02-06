-- Cryptic Helper Database Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clue Types table
CREATE TABLE clue_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_code TEXT NOT NULL,
  description TEXT NOT NULL,
  how_to_spot TEXT NOT NULL,
  common_indicators TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clues table
CREATE TABLE clues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clue_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  letter_pattern TEXT NOT NULL DEFAULT '',
  clue_type_id UUID REFERENCES clue_types(id) ON DELETE CASCADE,
  annotation TEXT NOT NULL DEFAULT '',
  definition_part TEXT NOT NULL DEFAULT '',
  wordplay_part TEXT NOT NULL DEFAULT '',
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  source TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Full-text search index on clues
ALTER TABLE clues ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', clue_text || ' ' || answer || ' ' || annotation)
  ) STORED;

CREATE INDEX idx_clues_search ON clues USING GIN (search_vector);
CREATE INDEX idx_clues_clue_type ON clues (clue_type_id);
CREATE INDEX idx_clues_difficulty ON clues (difficulty);

-- Clue Examples table (curated for education)
CREATE TABLE clue_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clue_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  letter_pattern TEXT NOT NULL DEFAULT '',
  clue_type_id UUID REFERENCES clue_types(id) ON DELETE CASCADE,
  annotation TEXT NOT NULL DEFAULT '',
  annotation_html TEXT,
  explanation TEXT NOT NULL DEFAULT '',
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clue_examples_clue_type ON clue_examples (clue_type_id);

-- Row-Level Security: public read access, service role write
ALTER TABLE clue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE clue_examples ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read on clue_types"
  ON clue_types FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on clues"
  ON clues FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on clue_examples"
  ON clue_examples FOR SELECT
  USING (true);
