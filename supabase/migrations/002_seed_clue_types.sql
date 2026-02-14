-- Seed the 9 cryptic crossword clue types
-- Data sourced from src/data/clue-types.ts

INSERT INTO clue_types (slug, name, short_code, description, how_to_spot, common_indicators, sort_order)
VALUES
  (
    'anagram',
    'Anagram',
    'ANAG',
    'The letters of one or more words in the clue are rearranged to form the answer. An anagram indicator signals that letters need to be mixed up.',
    'Look for an indicator word that suggests rearrangement, disorder, or change. The fodder (letters to rearrange) will be adjacent to the indicator.',
    ARRAY['broken', 'mixed', 'wild', 'crazy', 'new', 'reformed', 'shattered', 'confused', 'drunk', 'mangled', 'wrecked', 'troubled', 'badly', 'arranged', 'altered', 'cooked', 'destroyed', 'scrambled', 'upset'],
    1
  ),
  (
    'hidden-word',
    'Hidden Word',
    'HID',
    'The answer is literally hidden within the words of the clue. You can find it by reading across consecutive words and picking out a sequence of letters.',
    'Look for indicator words that suggest containment or partial visibility. The answer will span across word boundaries in the clue text.',
    ARRAY['in', 'within', 'part of', 'some', 'held by', 'concealed', 'hiding', 'contained in', 'buried in', 'among', 'partly', 'found in'],
    2
  ),
  (
    'double-definition',
    'Double Definition',
    'DD',
    'The clue consists of two (or occasionally more) separate definitions of the same word. Each definition leads to the same answer by a different meaning.',
    'These clues tend to be short. There is no wordplay indicator; instead, the clue splits into two distinct meanings. If a clue seems unusually short, try double definition first.',
    '{}',
    3
  ),
  (
    'charade',
    'Charade',
    'CHAR',
    'The answer is built by chaining smaller words or fragments together, one after another, like the game of charades. Each part of the clue defines a piece of the answer.',
    'Look for linking words that imply sequence. Each piece of the clue produces a short word or abbreviation that joins to form the answer.',
    ARRAY['after', 'before', 'following', 'with', 'and', 'then', 'first', 'leading', 'heading', 'attached to', 'next to', 'on'],
    4
  ),
  (
    'container',
    'Container',
    'CONT',
    'One word or set of letters is placed inside another to form the answer. One element "contains" or "surrounds" the other.',
    'Look for words suggesting one thing going inside another. The clue tells you which part goes inside which.',
    ARRAY['in', 'within', 'inside', 'around', 'outside', 'about', 'embracing', 'swallowing', 'clutching', 'holding', 'housing', 'containing', 'wrapping', 'surrounding'],
    5
  ),
  (
    'reversal',
    'Reversal',
    'REV',
    'A word is reversed (spelled backwards) to give the answer, or part of the answer. In down clues, reversal indicators may relate to upward direction.',
    'Look for words suggesting backward movement. The word being reversed may be a synonym or the literal letters.',
    ARRAY['back', 'returned', 'up', 'over', 'reflected', 'reversed', 'turned', 'receding', 'retiring', 'recalled', 'flipped', 'going west', 'coming back'],
    6
  ),
  (
    'homophone',
    'Homophone',
    'HOM',
    'The answer sounds like another word. The clue gives the meaning of the sound-alike word plus an indicator that hearing or speaking is involved.',
    'Look for words related to sound or hearing. One part of the clue defines the word that sounds like the answer.',
    ARRAY['sounds like', 'we hear', 'reportedly', 'say', 'spoken', 'audibly', 'on the radio', 'it is said', 'I hear', 'by the sound of it', 'to the audience', 'aloud', 'vocal'],
    7
  ),
  (
    'deletion',
    'Deletion',
    'DEL',
    'A letter or letters are removed from a word to produce the answer. This includes beheadment (removing the first letter), curtailment (removing the last), and internal deletion.',
    'Look for words suggesting removal. The type of removal tells you which letter(s) to drop.',
    ARRAY['headless', 'losing head', 'endless', 'curtailed', 'heartless', 'short', 'topless', 'nearly', 'almost', 'not quite', 'without', 'dropping', 'losing', 'beheaded', 'tailless'],
    8
  ),
  (
    'cryptic-definition',
    'Cryptic Definition',
    'CD',
    'The entire clue is a misleading definition of the answer. There is no separate wordplay component — instead, the whole clue is a punning or oblique description.',
    'If you cannot split the clue into definition + wordplay, it may be a cryptic definition. These often feature a question mark at the end. The entire clue should describe the answer in a whimsical or punning way.',
    ARRAY['?', 'perhaps', 'maybe', 'possibly', 'say'],
    9
  );
