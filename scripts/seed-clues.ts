/**
 * Seed script for populating the Supabase clues table with verified cryptic clue data.
 *
 * Usage: npx tsx scripts/seed-clues.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

interface SeedClue {
  clue_text: string;
  answer: string;
  letter_pattern: string;
  clue_type_slug: string;
  annotation: string;
  definition_part: string;
  wordplay_part: string;
  difficulty: number;
  source: string;
  is_verified: boolean;
}

// Verified clue-answer pairs sourced from Times for the Times blog
const SEED_CLUES: SeedClue[] = [
  // ── Anagrams ──
  {
    clue_text: 'Vile mead drunk in the Middle Ages',
    answer: 'MEDIEVAL',
    letter_pattern: '8',
    clue_type_slug: 'anagram',
    annotation: 'ANAGRAM: VILE MEAD rearranged = MEDIEVAL',
    definition_part: 'in the Middle Ages',
    wordplay_part: 'VILE MEAD anagrammed by "drunk"',
    difficulty: 2,
    source: 'Times Quick Cryptic 3219',
    is_verified: true,
  },
  {
    clue_text: 'European landmark one dreamt in need of reconstruction',
    answer: 'NOTRE DAME',
    letter_pattern: '5,4',
    clue_type_slug: 'anagram',
    annotation: 'ANAGRAM: ONE DREAMT rearranged = NOTRE DAME',
    definition_part: 'European landmark',
    wordplay_part: 'ONE DREAMT anagrammed by "in need of reconstruction"',
    difficulty: 2,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  {
    clue_text: 'Start travelling to Nigeria',
    answer: 'ORIGINATE',
    letter_pattern: '9',
    clue_type_slug: 'anagram',
    annotation: 'ANAGRAM: TO NIGERIA rearranged = ORIGINATE',
    definition_part: 'Start',
    wordplay_part: 'TO NIGERIA anagrammed by "travelling"',
    difficulty: 2,
    source: 'Times Quick Cryptic 3219',
    is_verified: true,
  },
  {
    clue_text: 'Reused an improvised submarine',
    answer: 'UNDERSEA',
    letter_pattern: '8',
    clue_type_slug: 'anagram',
    annotation: 'ANAGRAM: REUSED AN rearranged = UNDERSEA',
    definition_part: 'submarine',
    wordplay_part: 'REUSED AN anagrammed by "improvised"',
    difficulty: 2,
    source: 'Times Quick Cryptic 3219',
    is_verified: true,
  },
  {
    clue_text: 'Nato led astray — hawkish?',
    answer: 'TALONED',
    letter_pattern: '7',
    clue_type_slug: 'anagram',
    annotation: 'ANAGRAM: NATO LED rearranged = TALONED',
    definition_part: 'hawkish',
    wordplay_part: 'NATO LED anagrammed by "astray"',
    difficulty: 2,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  // ── Hidden Words ──
  {
    clue_text: 'Cross section of lengthy bridge',
    answer: 'HYBRID',
    letter_pattern: '6',
    clue_type_slug: 'hidden-word',
    annotation: 'HIDDEN WORD: lengthY BRIDge contains HYBRID',
    definition_part: 'Cross',
    wordplay_part: 'hidden in "lengthy bridge"',
    difficulty: 1,
    source: 'Times Quick Cryptic 3219',
    is_verified: true,
  },
  {
    clue_text: 'Sound spanned by Port Hudson',
    answer: 'THUD',
    letter_pattern: '4',
    clue_type_slug: 'hidden-word',
    annotation: 'HIDDEN WORD: porT HUDson contains THUD',
    definition_part: 'Sound',
    wordplay_part: 'hidden in "Port Hudson"',
    difficulty: 1,
    source: 'Times Cryptic 29457',
    is_verified: true,
  },
  // ── Double Definitions ──
  {
    clue_text: 'Piece of land in Israeli port',
    answer: 'ACRE',
    letter_pattern: '4',
    clue_type_slug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: ACRE = unit of land & ACRE = Israeli city',
    definition_part: 'Piece of land / Israeli port',
    wordplay_part: 'two definitions',
    difficulty: 1,
    source: 'Times Quick Cryptic 3219',
    is_verified: true,
  },
  {
    clue_text: 'Lover of the bottle, very green',
    answer: 'LUSH',
    letter_pattern: '4',
    clue_type_slug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: LUSH = drunkard & LUSH = verdant',
    definition_part: 'Lover of the bottle / very green',
    wordplay_part: 'two definitions',
    difficulty: 1,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  {
    clue_text: 'A knockout, knockout blow?',
    answer: 'BOMBSHELL',
    letter_pattern: '8',
    clue_type_slug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: BOMBSHELL = stunning person & BOMBSHELL = explosive',
    definition_part: 'A knockout / knockout blow',
    wordplay_part: 'two definitions',
    difficulty: 2,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  // ── Charades ──
  {
    clue_text: 'Storm ripped flap',
    answer: 'TORNADO',
    letter_pattern: '7',
    clue_type_slug: 'charade',
    annotation: 'CHARADE: TORN (ripped) + ADO (flap) = TORNADO',
    definition_part: 'Storm',
    wordplay_part: 'TORN + ADO',
    difficulty: 1,
    source: 'Times Quick Cryptic 3219',
    is_verified: true,
  },
  {
    clue_text: 'Most cunning copper on trial',
    answer: 'CUTEST',
    letter_pattern: '6',
    clue_type_slug: 'charade',
    annotation: 'CHARADE: CU (copper) + TEST (trial) = CUTEST',
    definition_part: 'Most cunning',
    wordplay_part: 'CU + TEST',
    difficulty: 2,
    source: 'Times Quick Cryptic 3219',
    is_verified: true,
  },
  {
    clue_text: 'Access connected with digestive tract',
    answer: 'ENTERON',
    letter_pattern: '7',
    clue_type_slug: 'charade',
    annotation: 'CHARADE: ENTER (access) + ON (connected) = ENTERON',
    definition_part: 'digestive tract',
    wordplay_part: 'ENTER + ON',
    difficulty: 3,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  // ── Containers ──
  {
    clue_text: 'Expand route to tunnel through mountain',
    answer: 'BROADEN',
    letter_pattern: '7',
    clue_type_slug: 'container',
    annotation: 'CONTAINER: ROAD inside BEN = BROADEN',
    definition_part: 'Expand',
    wordplay_part: 'ROAD (route) inside BEN (mountain)',
    difficulty: 2,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  {
    clue_text: 'VIP into dirt — seedy stuff?',
    answer: 'MUSTARD',
    letter_pattern: '7',
    clue_type_slug: 'container',
    annotation: 'CONTAINER: STAR inside MUD = MUSTARD',
    definition_part: 'seedy stuff',
    wordplay_part: 'STAR (VIP) inside MUD (dirt)',
    difficulty: 2,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  {
    clue_text: 'Greek character frames clever picture',
    answer: 'TABLEAU',
    letter_pattern: '7',
    clue_type_slug: 'container',
    annotation: 'CONTAINER: ABLE inside TAU = TABLEAU',
    definition_part: 'picture',
    wordplay_part: 'TAU (Greek letter) around ABLE (clever)',
    difficulty: 3,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  // ── Homophones ──
  {
    clue_text: 'Locate quote for auditors',
    answer: 'SITE',
    letter_pattern: '4',
    clue_type_slug: 'homophone',
    annotation: 'HOMOPHONE: sounds like CITE (quote) = SITE',
    definition_part: 'Locate',
    wordplay_part: 'CITE sounds like SITE',
    difficulty: 1,
    source: 'Times Quick Cryptic 3219',
    is_verified: true,
  },
  {
    clue_text: 'Mildly obscene — as love, did you say?',
    answer: 'NAUGHTY',
    letter_pattern: '7',
    clue_type_slug: 'homophone',
    annotation: 'HOMOPHONE: sounds like NOUGHT-Y = NAUGHTY',
    definition_part: 'Mildly obscene',
    wordplay_part: 'NOUGHT (love/zero) + Y sounds like NAUGHTY',
    difficulty: 3,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  // ── Cryptic Definitions ──
  {
    clue_text: "That's the way the cookie crumbles — but this food's solid!",
    answer: 'HARD CHEESE',
    letter_pattern: '4,6',
    clue_type_slug: 'cryptic-definition',
    annotation: 'CRYPTIC DEFINITION: "hard cheese" = bad luck expression & literal solid food',
    definition_part: 'the way the cookie crumbles / solid food',
    wordplay_part: 'entire clue is a punning definition',
    difficulty: 2,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
  {
    clue_text: 'Miserable result of eating duck?',
    answer: 'DOWN IN THE MOUTH',
    letter_pattern: '4,2,3,5',
    clue_type_slug: 'cryptic-definition',
    annotation: 'CRYPTIC DEFINITION: "down in the mouth" = miserable & duck feathers going in your mouth',
    definition_part: 'Miserable',
    wordplay_part: 'entire clue is a punning definition involving eating duck (down)',
    difficulty: 3,
    source: 'Times Cryptic 29459',
    is_verified: true,
  },
];

async function seed() {
  console.log(`Seeding ${SEED_CLUES.length} clues...`);

  // First, fetch clue_type IDs by slug
  const { data: clueTypes, error: typeError } = await supabase
    .from('clue_types')
    .select('id, slug');

  if (typeError) {
    console.error('Error fetching clue types:', typeError);
    process.exit(1);
  }

  const typeMap = new Map(
    (clueTypes ?? []).map((t: { id: string; slug: string }) => [t.slug, t.id])
  );

  let inserted = 0;
  let skipped = 0;

  for (const clue of SEED_CLUES) {
    const clueTypeId = typeMap.get(clue.clue_type_slug);
    if (!clueTypeId) {
      console.warn(`Unknown clue type: ${clue.clue_type_slug}, skipping`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from('clues').upsert(
      {
        id: crypto.randomUUID(),
        clue_text: clue.clue_text,
        answer: clue.answer,
        letter_pattern: clue.letter_pattern,
        clue_type_id: clueTypeId,
        annotation: clue.annotation,
        definition_part: clue.definition_part,
        wordplay_part: clue.wordplay_part,
        difficulty: clue.difficulty,
        source: clue.source,
        is_verified: clue.is_verified,
      },
      { onConflict: 'clue_text' }
    );

    if (error) {
      console.warn(`Failed to insert "${clue.answer}":`, error.message);
      skipped++;
    } else {
      inserted++;
    }
  }

  console.log(`Done: ${inserted} inserted, ${skipped} skipped`);
}

seed().catch(console.error);
