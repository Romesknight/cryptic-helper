import type { ClueType, ClueExample } from '@/types/clue';

export const CLUE_TYPES: ClueType[] = [
  {
    id: 'ct-anagram',
    slug: 'anagram',
    name: 'Anagram',
    shortCode: 'ANAG',
    description:
      'The letters of one or more words in the clue are rearranged to form the answer. An anagram indicator signals that letters need to be mixed up.',
    howToSpot:
      'Look for an indicator word that suggests rearrangement, disorder, or change — such as "broken", "mixed", "wild", "crazy", "new", "reformed". The fodder (letters to rearrange) will be adjacent to the indicator.',
    commonIndicators: [
      'broken', 'mixed', 'wild', 'crazy', 'new', 'reformed', 'shattered',
      'confused', 'drunk', 'mangled', 'wrecked', 'troubled', 'badly',
      'arranged', 'altered', 'cooked', 'destroyed', 'scrambled', 'upset',
    ],
    sortOrder: 1,
  },
  {
    id: 'ct-hidden-word',
    slug: 'hidden-word',
    name: 'Hidden Word',
    shortCode: 'HID',
    description:
      'The answer is literally hidden within the words of the clue. You can find it by reading across consecutive words and picking out a sequence of letters.',
    howToSpot:
      'Look for indicator words that suggest containment or partial visibility — "in", "within", "part of", "some", "held by", "concealed". The answer will span across word boundaries in the clue text.',
    commonIndicators: [
      'in', 'within', 'part of', 'some', 'held by', 'concealed', 'hiding',
      'contained in', 'buried in', 'among', 'partly', 'found in',
    ],
    sortOrder: 2,
  },
  {
    id: 'ct-double-definition',
    slug: 'double-definition',
    name: 'Double Definition',
    shortCode: 'DD',
    description:
      'The clue consists of two (or occasionally more) separate definitions of the same word. Each definition leads to the same answer by a different meaning.',
    howToSpot:
      'These clues tend to be short — often just two or three words. There is no wordplay indicator; instead, the clue splits into two distinct meanings. If a clue seems unusually short, try double definition first.',
    commonIndicators: [],
    sortOrder: 3,
  },
  {
    id: 'ct-charade',
    slug: 'charade',
    name: 'Charade',
    shortCode: 'CHAR',
    description:
      'The answer is built by chaining smaller words or fragments together, one after another, like the game of charades. Each part of the clue defines a piece of the answer.',
    howToSpot:
      'Look for linking words that imply sequence — "after", "before", "following", "with", "and", "then". Each piece of the clue produces a short word or abbreviation that joins to form the answer.',
    commonIndicators: [
      'after', 'before', 'following', 'with', 'and', 'then', 'first',
      'leading', 'heading', 'attached to', 'next to', 'on',
    ],
    sortOrder: 4,
  },
  {
    id: 'ct-container',
    slug: 'container',
    name: 'Container',
    shortCode: 'CONT',
    description:
      'One word or set of letters is placed inside another to form the answer. One element "contains" or "surrounds" the other.',
    howToSpot:
      'Look for words suggesting one thing going inside another — "in", "within", "inside", "around", "outside", "about", "embracing", "swallowing". The clue tells you which part goes inside which.',
    commonIndicators: [
      'in', 'within', 'inside', 'around', 'outside', 'about', 'embracing',
      'swallowing', 'clutching', 'holding', 'housing', 'containing',
      'wrapping', 'surrounding',
    ],
    sortOrder: 5,
  },
  {
    id: 'ct-reversal',
    slug: 'reversal',
    name: 'Reversal',
    shortCode: 'REV',
    description:
      'A word is reversed (spelled backwards) to give the answer, or part of the answer. In down clues, reversal indicators may relate to upward direction.',
    howToSpot:
      'Look for words suggesting backward movement — "back", "returned", "up" (in down clues), "over", "reflected", "reversed", "turned". The word being reversed may be a synonym or the literal letters.',
    commonIndicators: [
      'back', 'returned', 'up', 'over', 'reflected', 'reversed', 'turned',
      'receding', 'retiring', 'recalled', 'flipped', 'going west',
      'coming back',
    ],
    sortOrder: 6,
  },
  {
    id: 'ct-homophone',
    slug: 'homophone',
    name: 'Homophone',
    shortCode: 'HOM',
    description:
      'The answer sounds like another word. The clue gives the meaning of the sound-alike word plus an indicator that hearing or speaking is involved.',
    howToSpot:
      'Look for words related to sound or hearing — "sounds like", "we hear", "reportedly", "say", "spoken", "audibly", "on the radio". One part of the clue defines the word that sounds like the answer.',
    commonIndicators: [
      'sounds like', 'we hear', 'reportedly', 'say', 'spoken', 'audibly',
      'on the radio', 'it is said', 'I hear', 'by the sound of it',
      'to the audience', 'aloud', 'vocal',
    ],
    sortOrder: 7,
  },
  {
    id: 'ct-deletion',
    slug: 'deletion',
    name: 'Deletion',
    shortCode: 'DEL',
    description:
      'A letter or letters are removed from a word to produce the answer. This includes beheadment (removing the first letter), curtailment (removing the last), and internal deletion.',
    howToSpot:
      'Look for words suggesting removal — "headless", "losing head", "endless", "curtailed", "heartless", "short", "topless", "nearly", "almost". The type of removal tells you which letter(s) to drop.',
    commonIndicators: [
      'headless', 'losing head', 'endless', 'curtailed', 'heartless',
      'short', 'topless', 'nearly', 'almost', 'not quite', 'without',
      'dropping', 'losing', 'beheaded', 'tailless',
    ],
    sortOrder: 8,
  },
  {
    id: 'ct-cryptic-definition',
    slug: 'cryptic-definition',
    name: 'Cryptic Definition',
    shortCode: 'CD',
    description:
      'The entire clue is a misleading definition of the answer. There is no separate wordplay component — instead, the whole clue is a punning or oblique description.',
    howToSpot:
      'If you cannot split the clue into definition + wordplay, it may be a cryptic definition. These often feature a question mark at the end. The entire clue should describe the answer in a whimsical or punning way.',
    commonIndicators: ['?', 'perhaps', 'maybe', 'possibly', 'say'],
    sortOrder: 9,
  },
];

export const CLUE_EXAMPLES: ClueExample[] = [
  // ── ANAGRAM ──
  {
    id: 'ex-anag-1',
    clueText: 'Crazy leader is more dangerous (8)',
    answer: 'DEADLIER',
    letterPattern: '(8)',
    clueTypeSlug: 'anagram',
    annotation: 'ANAGRAM: **DEADLIER** — [Crazy] is the anagram indicator. {LEADER IS} (8 letters) rearranged → **DEADLIER** (more dangerous).',
    explanation: '"Crazy" signals an anagram. The letters of "leader is" (L-E-A-D-E-R-I-S) rearrange to spell DEADLIER, meaning "more dangerous".',
    difficulty: 1,
  },
  {
    id: 'ex-anag-2',
    clueText: 'Moon starer could be one who watches the sky (10)',
    answer: 'ASTRONOMER',
    letterPattern: '(10)',
    clueTypeSlug: 'anagram',
    annotation: 'ANAGRAM: **ASTRONOMER** — {MOON STARER} (10 letters) rearranged → **ASTRONOMER** (one who watches the sky).',
    explanation: 'A famous cryptic example. "Moon starer" has exactly 10 letters which rearrange to spell ASTRONOMER — someone who watches the sky.',
    difficulty: 1,
  },
  {
    // Source: Times Quick Cryptic 3219 (14ac) — verified by timesforthetimes.co.uk
    id: 'ex-anag-3',
    clueText: 'Vile mead drunk in the Middle Ages (8)',
    answer: 'MEDIEVAL',
    letterPattern: '(8)',
    clueTypeSlug: 'anagram',
    annotation: 'ANAGRAM: **MEDIEVAL** — [drunk] is the anagram indicator. {VILE MEAD} (8 letters) rearranged → **MEDIEVAL** (in the Middle Ages).',
    explanation: '"Drunk" signals an anagram. The letters of "vile mead" (V-I-L-E-M-E-A-D) rearrange to spell MEDIEVAL, meaning "in the Middle Ages". Source: Times Quick Cryptic 3219.',
    difficulty: 2,
  },
  // ── HIDDEN WORD ──
  {
    id: 'ex-hid-1',
    clueText: 'Some co-operation is a musical performance (5)',
    answer: 'OPERA',
    letterPattern: '(5)',
    clueTypeSlug: 'hidden-word',
    annotation: 'HIDDEN WORD: **OPERA** — [Some] is the hidden word indicator. Hidden in "co-**OPERA**tion" → **OPERA** (a musical performance).',
    explanation: '"Some" signals a hidden word. The answer OPERA is concealed within "co-operation": c-o-O-P-E-R-A-t-i-o-n.',
    difficulty: 1,
  },
  {
    // Source: Times Quick Cryptic 3219 (25ac) — verified by timesforthetimes.co.uk
    id: 'ex-hid-2',
    clueText: 'Cross section of lengthy bridge (6)',
    answer: 'HYBRID',
    letterPattern: '(6)',
    clueTypeSlug: 'hidden-word',
    annotation: 'HIDDEN WORD: **HYBRID** — [section of] is the hidden word indicator. Hidden in "lengt**HY BRID**ge" → **HYBRID** (cross).',
    explanation: '"Section of" signals a hidden word. HYBRID (meaning cross/mixed) is hidden spanning "lengt-HY BRID-ge". Source: Times Quick Cryptic 3219.',
    difficulty: 1,
  },
  {
    // Source: Times Cryptic 29457 (23dn) — verified by timesforthetimes.co.uk
    id: 'ex-hid-3',
    clueText: 'Sound spanned by Port Hudson (4)',
    answer: 'THUD',
    letterPattern: '(4)',
    clueTypeSlug: 'hidden-word',
    annotation: 'HIDDEN WORD: **THUD** — [spanned by] is the hidden word indicator. Hidden in "Por**T HUD**son" → **THUD** (a sound).',
    explanation: '"Spanned by" signals a hidden word. THUD (a heavy sound) spans across "Por-T HUD-son". Source: Times Cryptic 29457.',
    difficulty: 2,
  },
  // ── DOUBLE DEFINITION ──
  {
    id: 'ex-dd-1',
    clueText: 'Vessel basin (4)',
    answer: 'BOWL',
    letterPattern: '(4)',
    clueTypeSlug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: **BOWL** — "vessel" (a container) and "basin" (a dish). Two definitions, one answer.',
    explanation: 'Both "vessel" and "basin" independently define BOWL. The short clue is typical of double definitions — no wordplay indicator needed.',
    difficulty: 1,
  },
  {
    id: 'ex-dd-2',
    clueText: 'Left harbour (4)',
    answer: 'PORT',
    letterPattern: '(4)',
    clueTypeSlug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: **PORT** — "left" (the left side of a ship) and "harbour" (a place for ships). Two meanings, one word.',
    explanation: '"Left" in nautical terms means the port side, and "harbour" is a port. Two distinct meanings point to the same four-letter answer.',
    difficulty: 1,
  },
  {
    // Source: Times Cryptic 29459 (26ac) — verified by timesforthetimes.co.uk
    id: 'ex-dd-3',
    clueText: 'Lover of the bottle, very green (4)',
    answer: 'LUSH',
    letterPattern: '(4)',
    clueTypeSlug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: **LUSH** — "lover of the bottle" (a heavy drinker) and "very green" (lush vegetation). Two definitions, one answer.',
    explanation: '"Lover of the bottle" means a lush (drinker), and "very green" describes lush vegetation. Two meanings converge on one word. Source: Times Cryptic 29459.',
    difficulty: 2,
  },
  // ── CHARADE ──
  {
    // Source: Times Quick Cryptic 3219 (8ac) — verified by timesforthetimes.co.uk
    id: 'ex-char-1',
    clueText: 'Storm ripped flap (7)',
    answer: 'TORNADO',
    letterPattern: '(7)',
    clueTypeSlug: 'charade',
    annotation: 'CHARADE: **TORNADO** — TORN (ripped) + ADO (flap/fuss) joined together. Definition: "storm" = TORNADO.',
    explanation: 'TORN (meaning ripped) + ADO (meaning flap/commotion) = TORNADO (a storm). Each word in the wordplay produces a piece of the answer. Source: Times Quick Cryptic 3219.',
    difficulty: 1,
  },
  {
    // Source: Times Quick Cryptic 3219 (1dn) — verified by timesforthetimes.co.uk
    id: 'ex-char-2',
    clueText: 'Most cunning copper on trial (6)',
    answer: 'CUTEST',
    letterPattern: '(6)',
    clueTypeSlug: 'charade',
    annotation: 'CHARADE: **CUTEST** — CU (copper, chemical symbol) + TEST (trial) joined together. Definition: "most cunning" = CUTEST (as in cute/clever).',
    explanation: 'CU (the chemical symbol for copper) + TEST (a trial) = CUTEST (most cunning/clever). Source: Times Quick Cryptic 3219.',
    difficulty: 2,
  },
  {
    // Source: Times Cryptic 29459 (1ac) — verified by timesforthetimes.co.uk
    id: 'ex-char-3',
    clueText: 'Little kid held prisoner? One growing up slowly (10)',
    answer: 'STALAGMITE',
    letterPattern: '(10)',
    clueTypeSlug: 'charade',
    annotation: 'CHARADE: **STALAGMITE** — STALAG (prisoner of war camp) + MITE (little kid) joined together. Definition: "one growing up slowly" = a stalagmite grows upward from a cave floor.',
    explanation: 'STALAG (a POW camp, "held prisoner") + MITE (a small child, "little kid") = STALAGMITE (a cave formation that grows up slowly). Source: Times Cryptic 29459.',
    difficulty: 3,
  },
  // ── CONTAINER ──
  {
    // Source: Times Cryptic 29459 (7ac) — verified by timesforthetimes.co.uk
    id: 'ex-cont-1',
    clueText: 'Expand route to tunnel through mountain (7)',
    answer: 'BROADEN',
    letterPattern: '(7)',
    clueTypeSlug: 'container',
    annotation: 'CONTAINER: **BROADEN** — [through] is the container indicator. ROAD (route) placed inside BEN (mountain) → B-**ROAD**-EN = **BROADEN** (expand).',
    explanation: '"Through" signals containment. ROAD (route) is placed inside BEN (a Scottish mountain): B + ROAD + EN = BROADEN, meaning to expand. Source: Times Cryptic 29459.',
    difficulty: 2,
  },
  {
    // Source: Times Cryptic 29459 (13dn) — verified by timesforthetimes.co.uk
    id: 'ex-cont-2',
    clueText: 'VIP into dirt — seedy stuff? (7)',
    answer: 'MUSTARD',
    letterPattern: '(7)',
    clueTypeSlug: 'container',
    annotation: 'CONTAINER: **MUSTARD** — [into] is the container indicator. STAR (VIP) placed inside MUD (dirt) → MU-**STAR**-D = **MUSTARD** (seedy stuff).',
    explanation: '"Into" signals containment. STAR (a VIP) is placed inside MUD (dirt): MU + STAR + D = MUSTARD (a plant that produces seeds). Source: Times Cryptic 29459.',
    difficulty: 2,
  },
  {
    // Source: Times Cryptic 29459 (14dn) — verified by timesforthetimes.co.uk
    id: 'ex-cont-3',
    clueText: 'Greek character frames clever picture (7)',
    answer: 'TABLEAU',
    letterPattern: '(7)',
    clueTypeSlug: 'container',
    annotation: 'CONTAINER: **TABLEAU** — [frames] is the container indicator. TAU (Greek letter) contains ABLE (clever) → T-**ABLE**-AU = **TABLEAU** (picture/scene).',
    explanation: '"Frames" signals containment. TAU (a Greek letter) surrounds ABLE (clever): T + ABLE + AU = TABLEAU (a vivid picture or scene). Source: Times Cryptic 29459.',
    difficulty: 3,
  },
  // ── REVERSAL ──
  {
    id: 'ex-rev-1',
    clueText: 'Desserts turned back into emphasised (8)',
    answer: 'STRESSED',
    letterPattern: '(8)',
    clueTypeSlug: 'reversal',
    annotation: 'REVERSAL: **STRESSED** — [turned back] is the reversal indicator. DESSERTS reversed: D-E-S-S-E-R-T-S → S-T-R-E-S-S-E-D = **STRESSED** (emphasised).',
    explanation: '"Turned back" signals a reversal. DESSERTS spelled backwards gives STRESSED, meaning "emphasised". One of the most famous cryptic clue examples!',
    difficulty: 1,
  },
  {
    id: 'ex-rev-2',
    clueText: 'Extracted minerals returned as a fabric (5)',
    answer: 'DENIM',
    letterPattern: '(5)',
    clueTypeSlug: 'reversal',
    annotation: 'REVERSAL: **DENIM** — [returned] is the reversal indicator. MINED reversed: M-I-N-E-D → D-E-N-I-M = **DENIM** (a fabric).',
    explanation: '"Returned" signals a reversal. MINED (extracted minerals) reversed gives DENIM (a type of fabric).',
    difficulty: 2,
  },
  {
    id: 'ex-rev-3',
    clueText: 'Reward reversed becomes a furniture compartment (6)',
    answer: 'DRAWER',
    letterPattern: '(6)',
    clueTypeSlug: 'reversal',
    annotation: 'REVERSAL: **DRAWER** — [reversed] is the reversal indicator. REWARD reversed: R-E-W-A-R-D → D-R-A-W-E-R = **DRAWER** (a furniture compartment).',
    explanation: '"Reversed" signals a reversal. REWARD spelled backwards gives DRAWER (a sliding compartment in furniture).',
    difficulty: 1,
  },
  // ── HOMOPHONE ──
  {
    id: 'ex-hom-1',
    clueText: 'Permitted out loud, we hear (5)',
    answer: 'ALOUD',
    letterPattern: '(5)',
    clueTypeSlug: 'homophone',
    annotation: 'HOMOPHONE: **ALOUD** — [we hear] is the homophone indicator. "Permitted" = ALLOWED, which sounds like **ALOUD** (out loud).',
    explanation: '"We hear" signals a homophone. ALLOWED (meaning "permitted") sounds like ALOUD (meaning "out loud"). The answer is the sound-alike word.',
    difficulty: 1,
  },
  {
    // Source: Times Quick Cryptic 3219 (11ac) — verified by timesforthetimes.co.uk
    id: 'ex-hom-2',
    clueText: 'Locate quote for auditors (4)',
    answer: 'SITE',
    letterPattern: '(4)',
    clueTypeSlug: 'homophone',
    annotation: 'HOMOPHONE: **SITE** — [for auditors] is the homophone indicator. "Quote" = CITE, which sounds like **SITE** (locate/place).',
    explanation: '"For auditors" signals a homophone. CITE (to quote) sounds like SITE (a location). Definition: "locate". Source: Times Quick Cryptic 3219.',
    difficulty: 1,
  },
  {
    // Source: Times Cryptic 29459 (25ac) — verified by timesforthetimes.co.uk
    id: 'ex-hom-3',
    clueText: 'Mildly obscene — as love, did you say? (7)',
    answer: 'NAUGHTY',
    letterPattern: '(7)',
    clueTypeSlug: 'homophone',
    annotation: 'HOMOPHONE: **NAUGHTY** — [did you say] is the homophone indicator. "Love" = NOUGHT (zero in tennis), which sounds like **NAUGHT**. Add -Y → **NAUGHTY** (mildly obscene).',
    explanation: '"Did you say" signals a homophone. NOUGHT-Y (zero-ish/love-ish) sounds like NAUGHTY (mildly obscene). Source: Times Cryptic 29459.',
    difficulty: 3,
  },
  // ── DELETION ──
  {
    id: 'ex-del-1',
    clueText: 'Headless beast is a direction (4)',
    answer: 'EAST',
    letterPattern: '(4)',
    clueTypeSlug: 'deletion',
    annotation: 'DELETION: **EAST** — [Headless] is the deletion indicator (beheadment). **B**EAST with first letter B removed → **EAST** (a direction).',
    explanation: '"Headless" signals removing the first letter. BEAST loses its "head" (B) to give EAST, a compass direction.',
    difficulty: 1,
  },
  {
    id: 'ex-del-2',
    clueText: 'Curtailed scarf leaves a mark (4)',
    answer: 'SCAR',
    letterPattern: '(4)',
    clueTypeSlug: 'deletion',
    annotation: 'DELETION: **SCAR** — [Curtailed] is the deletion indicator (curtailment). SCAR**F** with last letter F removed → **SCAR** (a mark).',
    explanation: '"Curtailed" signals removing the final letter. SCARF loses its last letter (F) to give SCAR, meaning a mark or blemish.',
    difficulty: 1,
  },
  {
    id: 'ex-del-3',
    clueText: 'Headless wheat provides warmth (4)',
    answer: 'HEAT',
    letterPattern: '(4)',
    clueTypeSlug: 'deletion',
    annotation: 'DELETION: **HEAT** — [Headless] is the deletion indicator (beheadment). **W**HEAT with first letter W removed → **HEAT** (warmth).',
    explanation: '"Headless" signals removing the first letter. WHEAT loses its "head" (W) to give HEAT, meaning warmth.',
    difficulty: 1,
  },
  // ── CRYPTIC DEFINITION ──
  {
    id: 'ex-cd-1',
    clueText: 'A stiff examination? (4,6)',
    answer: 'POST MORTEM',
    letterPattern: '(4,6)',
    clueTypeSlug: 'cryptic-definition',
    annotation: 'CRYPTIC DEFINITION: **POST MORTEM** — The entire clue is a punning definition. "A stiff" = a dead body. "Examination" = an analysis. A post mortem is literally an examination of a stiff.',
    explanation: 'No separate wordplay — the whole clue is the definition. The question mark signals a cryptic reading. "A stiff examination" describes POST MORTEM on two levels.',
    difficulty: 1,
  },
  {
    id: 'ex-cd-2',
    clueText: 'Gegs (9,4)',
    answer: 'SCRAMBLED EGGS',
    letterPattern: '(9,4)',
    clueTypeSlug: 'cryptic-definition',
    annotation: 'CRYPTIC DEFINITION: **SCRAMBLED EGGS** — "Gegs" is the word "eggs" with its letters scrambled. The clue literally IS the answer: scrambled eggs!',
    explanation: 'A brilliantly minimal cryptic definition. "Gegs" shows the letters of "eggs" in scrambled order — so the answer is SCRAMBLED EGGS.',
    difficulty: 1,
  },
  {
    // Source: Times Cryptic 29459 (26dn) — verified by timesforthetimes.co.uk
    id: 'ex-cd-3',
    clueText: "That's the way the cookie crumbles — but this food's solid! (4,6)",
    answer: 'HARD CHEESE',
    letterPattern: '(4,6)',
    clueTypeSlug: 'cryptic-definition',
    annotation: 'CRYPTIC DEFINITION: **HARD CHEESE** — The entire clue is a punning definition. "That\'s the way the cookie crumbles" = HARD CHEESE (an expression of sympathy/bad luck). But HARD CHEESE is also literally a solid food!',
    explanation: 'The clue reads as sympathy ("hard cheese" = tough luck), but the answer is also literally a solid food — hard cheese. A classic cryptic double meaning. Source: Times Cryptic 29459.',
    difficulty: 2,
  },
];

/**
 * Get all examples for a specific clue type.
 */
export function getExamplesForType(slug: string): ClueExample[] {
  return CLUE_EXAMPLES.filter((ex) => ex.clueTypeSlug === slug);
}

/**
 * Get a clue type by its slug.
 */
export function getClueTypeBySlug(slug: string): ClueType | undefined {
  return CLUE_TYPES.find((ct) => ct.slug === slug);
}
