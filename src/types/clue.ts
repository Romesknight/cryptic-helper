export type ClueTypeName =
  | 'anagram'
  | 'hidden-word'
  | 'double-definition'
  | 'charade'
  | 'container'
  | 'reversal'
  | 'homophone'
  | 'deletion'
  | 'cryptic-definition';

export interface ClueType {
  id: string;
  slug: ClueTypeName;
  name: string;
  shortCode: string;
  description: string;
  howToSpot: string;
  commonIndicators: string[];
  sortOrder: number;
}

export interface Clue {
  id: string;
  clueText: string;
  answer: string;
  letterPattern: string;
  clueTypeId: string;
  clueType?: ClueType;
  annotation: string;
  definitionPart: string;
  wordplayPart: string;
  difficulty: 1 | 2 | 3;
  source?: string;
  isVerified: boolean;
}

export interface ClueExample {
  id: string;
  clueText: string;
  answer: string;
  letterPattern: string;
  clueTypeSlug: ClueTypeName;
  annotation: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
}
