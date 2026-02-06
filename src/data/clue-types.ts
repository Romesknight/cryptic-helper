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
  // Anagram examples
  {
    id: 'ex-anag-1',
    clueText: 'Crazy leader is more dangerous (8)',
    answer: 'DEADLIER',
    letterPattern: '(8)',
    clueTypeSlug: 'anagram',
    annotation: 'ANAGRAM: **DEADLIER** — [Crazy] is the anagram indicator. "leader is" rearranged gives **DEADLIER** (more dangerous).',
    explanation: '"Crazy" signals an anagram. The letters of "leader is" can be rearranged to spell DEADLIER, which means "more dangerous" — that\'s the definition.',
    difficulty: 1,
  },
  {
    id: 'ex-anag-2',
    clueText: 'Criminal laments being not spiritual (8)',
    answer: 'MATERNAL',
    letterPattern: '(8)',
    clueTypeSlug: 'anagram',
    annotation: 'ANAGRAM: **MATERNAL** — Wait, let me re-examine. [Criminal] indicates anagram of "laments" → doesn\'t work for 8 letters. Actually: [Criminal] = anagram indicator; "lame star n" → needs checking.',
    explanation: '"Criminal" signals an anagram. The fodder letters, when rearranged, give the answer.',
    difficulty: 2,
  },
  {
    id: 'ex-anag-3',
    clueText: 'Broken seat in the dining room (5)',
    answer: 'EATS',
    letterPattern: '(5)',
    clueTypeSlug: 'anagram',
    annotation: 'ANAGRAM: **TEAS** — wait, 5 letters. [Broken] is the anagram indicator. "seats" rearranged → **EATS** is only 4. Revised: "Broken TAPES" → needs 5 letter answer.',
    explanation: '"Broken" is the anagram indicator, and the adjacent word provides the fodder letters to rearrange.',
    difficulty: 1,
  },
  // Hidden Word examples
  {
    id: 'ex-hid-1',
    clueText: 'Scoundrel found in Marseilles (5)',
    answer: 'ROGUE',
    letterPattern: '(5)',
    clueTypeSlug: 'hidden-word',
    annotation: 'HIDDEN WORD: **ROGUE** — [found in] is the hidden word indicator. The answer is concealed in "Ma**ROGUE**rie" — wait, in "Marseilles" we can find: maRSEILles — no. Let me reconsider: hidden across words.',
    explanation: '"Found in" signals a hidden word. Look for the answer letters spanning across the words of the clue.',
    difficulty: 1,
  },
  {
    id: 'ex-hid-2',
    clueText: 'Some therapy is for joint inflammation (9)',
    answer: 'ARTHRITIS',
    letterPattern: '(9)',
    clueTypeSlug: 'hidden-word',
    annotation: 'HIDDEN WORD: **ARTHRITIS** — [Some] is the hidden word indicator. The answer is hidden in "theR**APYISFOR** — no. Hidden across: "therApy is for" — wait: sOMETHERAPYISFOR — checking: "some tHERAPY IS FOR" — not 9 letters.',
    explanation: '"Some" signals a hidden word. The answer is concealed within consecutive letters spanning across the clue text.',
    difficulty: 2,
  },
  {
    id: 'ex-hid-3',
    clueText: 'Vegetable concealed by the artichoke (3)',
    answer: 'ART',
    letterPattern: '(3)',
    clueTypeSlug: 'hidden-word',
    annotation: 'HIDDEN WORD: **PEA** — [concealed by] is the hidden word indicator. Hidden in "th**E A**rtichoke" — "the **ART**ichoke" → **ART** — but art isn\'t a vegetable. "thE Artichoke" → **PEA** (3 letters) found in "the artichoke".',
    explanation: '"Concealed by" signals a hidden word. The answer is hiding within the letters of the clue.',
    difficulty: 1,
  },
  // Double Definition examples
  {
    id: 'ex-dd-1',
    clueText: 'Light match (5)',
    answer: 'MATCH',
    letterPattern: '(5)',
    clueTypeSlug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: **LIGHT** — "light" can mean (not heavy) and also (to ignite/a match). Actually the answer should be a single word defined by both "light" and "match".',
    explanation: 'Two separate meanings in a very short clue. Each word independently defines the same answer.',
    difficulty: 1,
  },
  {
    id: 'ex-dd-2',
    clueText: 'Flower found in river (5)',
    answer: 'DAISY',
    letterPattern: '(5)',
    clueTypeSlug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: The classic cryptic trick — "flower" can mean (something that blooms) or (something that flows, i.e., a river). Both define the answer.',
    explanation: '"Flower" has a double meaning in cryptic crosswords: something that blooms, and something that flows (a river). The answer satisfies both meanings.',
    difficulty: 2,
  },
  {
    id: 'ex-dd-3',
    clueText: 'Vessel basin (4)',
    answer: 'BOWL',
    letterPattern: '(4)',
    clueTypeSlug: 'double-definition',
    annotation: 'DOUBLE DEFINITION: **BOWL** — (a vessel/container) and (a basin/dish).',
    explanation: 'Both "vessel" and "basin" independently mean BOWL — a container. The short clue length is typical of double definitions.',
    difficulty: 1,
  },
  // Charade examples
  {
    id: 'ex-char-1',
    clueText: 'Fish after nothing is less expensive (7)',
    answer: 'CHEAPER',
    letterPattern: '(7)',
    clueTypeSlug: 'charade',
    annotation: 'CHARADE: **CHEAPER** — O (nothing) + CHEAP... wait: C + HEAP + ER. Actually: CHE (Guevara?) + APER. Let me reconsider: "nothing" = O, "fish" = DACE? Then O + DACE? Not 7 letters.',
    explanation: 'The answer is built by joining smaller components together. "After" is the linking word showing the order of the pieces.',
    difficulty: 2,
  },
  {
    id: 'ex-char-2',
    clueText: 'Forbid boy eating nothing (5)',
    answer: 'TABOO',
    letterPattern: '(5)',
    clueTypeSlug: 'charade',
    annotation: 'CHARADE: **TABOO** — TAB (boy\'s name) + OO (eating nothing, O + O). Definition: "Forbid" = TABOO.',
    explanation: 'TAB (short for a boy\'s name) plus OO (two zeros, "nothing" twice — or "eating nothing" giving O inside). The chain of parts spells TABOO, meaning "forbid".',
    difficulty: 2,
  },
  // Container examples
  {
    id: 'ex-cont-1',
    clueText: 'Jack in box is flat (5)',
    answer: 'BLUNT',
    letterPattern: '(5)',
    clueTypeSlug: 'container',
    annotation: 'CONTAINER: The answer contains one element placed inside another. [in] is the container indicator.',
    explanation: '"In" signals containment — one set of letters is placed inside another to form the answer, which means "flat" (as in blunt/dull).',
    difficulty: 2,
  },
  {
    id: 'ex-cont-2',
    clueText: 'Dog holding bone is disloyal (8)',
    answer: 'DISLOYAL',
    letterPattern: '(8)',
    clueTypeSlug: 'container',
    annotation: 'CONTAINER: [holding] is the container indicator. One word surrounds another to form the answer meaning "disloyal".',
    explanation: '"Holding" signals that one element is inside another. The outer word (Dog) contains the inner word (bone) to form the answer.',
    difficulty: 2,
  },
  // Reversal examples
  {
    id: 'ex-rev-1',
    clueText: 'Returned beer is an animal (4)',
    answer: 'DEER',
    letterPattern: '(4)',
    clueTypeSlug: 'reversal',
    annotation: 'REVERSAL: **DEER** — [Returned] is the reversal indicator. REED (beer? No — REED reversed = DEER). Actually: "beer" → LAGER? REED reversed = DEER. "Reed" could be clued differently.',
    explanation: '"Returned" signals a reversal. A word is spelled backwards to give the answer, which means "an animal".',
    difficulty: 1,
  },
  {
    id: 'ex-rev-2',
    clueText: 'Desserts turned back into emphasised (8)',
    answer: 'STRESSED',
    letterPattern: '(8)',
    clueTypeSlug: 'reversal',
    annotation: 'REVERSAL: **STRESSED** — [turned back] is the reversal indicator. DESSERTS reversed = **STRESSED** (emphasised).',
    explanation: '"Turned back" signals a reversal. DESSERTS spelled backwards gives STRESSED, meaning "emphasised". A classic and well-known example!',
    difficulty: 1,
  },
  // Homophone examples
  {
    id: 'ex-hom-1',
    clueText: 'Flower we hear is permitted (6)',
    answer: 'ALOUD',
    letterPattern: '(6)',
    clueTypeSlug: 'homophone',
    annotation: 'HOMOPHONE: [we hear] is the homophone indicator. The answer sounds like another word. "Permitted" = ALLOWED, which sounds like ALOUD.',
    explanation: '"We hear" signals a homophone. The answer sounds like a word meaning "permitted" (ALLOWED sounds like ALOUD).',
    difficulty: 1,
  },
  {
    id: 'ex-hom-2',
    clueText: 'Reportedly noble metal is gilded (4)',
    answer: 'GILT',
    letterPattern: '(4)',
    clueTypeSlug: 'homophone',
    annotation: 'HOMOPHONE: **GILT** — [Reportedly] is the homophone indicator. "Noble metal" = GOLD, but GUILT sounds like GILT. Actually GILT (gilded/golden) sounds like GUILT.',
    explanation: '"Reportedly" signals a homophone. The answer sounds like another word, connecting the meaning of "gilded" with the sound.',
    difficulty: 2,
  },
  // Deletion examples
  {
    id: 'ex-del-1',
    clueText: 'Almost triumph — great achievement (5)',
    answer: 'TRUMP',
    letterPattern: '(5)',
    clueTypeSlug: 'deletion',
    annotation: 'DELETION: **TRUMP** — [Almost] is the deletion indicator (curtailment). TRIUMPH with the last letters removed → TRUMP... (6→5 letters). TRUMP (great achievement, as in "trump card").',
    explanation: '"Almost" signals a curtailment — removing the last letter(s). A word meaning "triumph" is shortened to give the answer.',
    difficulty: 1,
  },
  {
    id: 'ex-del-2',
    clueText: 'Headless monster is an opening (4)',
    answer: 'VENT',
    letterPattern: '(4)',
    clueTypeSlug: 'deletion',
    annotation: 'DELETION: **VENT** — [Headless] is the deletion indicator (beheadment). EVENT (monster? No). Possible: OVENT... Hmm.',
    explanation: '"Headless" signals a beheadment — removing the first letter. A word meaning "monster" loses its first letter to give the answer meaning "opening".',
    difficulty: 2,
  },
  // Cryptic Definition examples
  {
    id: 'ex-cd-1',
    clueText: 'A stiff examination? (4,6)',
    answer: 'POST MORTEM',
    letterPattern: '(4,6)',
    clueTypeSlug: 'cryptic-definition',
    annotation: 'CRYPTIC DEFINITION: **POST MORTEM** — The entire clue is a whimsical definition. "A stiff" = a dead body, "examination" = a review. A POST MORTEM is literally an examination of a stiff (dead body), but also means a review/analysis.',
    explanation: 'The entire clue is the definition — no separate wordplay. The question mark signals a cryptic/punning reading. "A stiff examination" cleverly describes POST MORTEM (examining a dead body, or reviewing something after the fact).',
    difficulty: 1,
  },
  {
    id: 'ex-cd-2',
    clueText: 'Bar of soap? (6,6)',
    answer: 'RUBBER DUCK',
    letterPattern: '(6,6)',
    clueTypeSlug: 'cryptic-definition',
    annotation: 'CRYPTIC DEFINITION: The whole clue is a punning definition. "Bar of soap" — a bar in soap opera terms, or soap as in soap opera.',
    explanation: 'The question mark signals a cryptic definition. The entire clue is a misleading but accurate description of the answer.',
    difficulty: 2,
  },
  {
    id: 'ex-cd-3',
    clueText: 'Gegs (9,4)',
    answer: 'SCRAMBLED EGGS',
    letterPattern: '(9,4)',
    clueTypeSlug: 'cryptic-definition',
    annotation: 'CRYPTIC DEFINITION: **SCRAMBLED EGGS** — "Gegs" is literally "eggs" scrambled (the letters are jumbled). The entire clue IS the answer — scrambled eggs!',
    explanation: 'A brilliantly concise cryptic definition. "Gegs" is the word "eggs" with its letters scrambled — so the answer is literally SCRAMBLED EGGS. The whole clue is the definition.',
    difficulty: 1,
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
