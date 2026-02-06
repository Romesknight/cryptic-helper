import type { ClueTypeName } from '@/types/clue';

export const CLUE_TYPE_COLORS: Record<ClueTypeName, { bg: string; text: string; border: string }> = {
  'anagram': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'hidden-word': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'double-definition': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'charade': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'container': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'reversal': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'homophone': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'deletion': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'cryptic-definition': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export const CLUE_TYPE_SHORT_CODES: Record<ClueTypeName, string> = {
  'anagram': 'ANAG',
  'hidden-word': 'HID',
  'double-definition': 'DD',
  'charade': 'CHAR',
  'container': 'CONT',
  'reversal': 'REV',
  'homophone': 'HOM',
  'deletion': 'DEL',
  'cryptic-definition': 'CD',
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

export const RATE_LIMIT = {
  MAX_REQUESTS: 20,
  WINDOW_MS: 60 * 1000,
};

export const MAX_CLUE_LENGTH = 500;
