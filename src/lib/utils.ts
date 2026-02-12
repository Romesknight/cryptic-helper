import { type ClassValue, clsx } from 'clsx';

/**
 * Merge class names, filtering out falsy values.
 * Uses clsx for conditional class joining.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a letter pattern for display.
 * Ensures pattern is wrapped in parentheses.
 */
export function formatLetterPattern(pattern: string): string {
  const trimmed = pattern.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) return trimmed;
  return `(${trimmed})`;
}

/**
 * Validate a letter pattern string.
 * Accepts patterns like "7", "4,3", "(7)", "(4,3)", "4-3", etc.
 */
export function isValidLetterPattern(pattern: string): boolean {
  const trimmed = pattern.trim().replace(/^\(|\)$/g, '');
  return /^[\d,\s-]+$/.test(trimmed);
}

/**
 * Slugify a string for URL use.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalize text to plain ASCII-safe characters.
 *
 * Replaces typographic characters (smart quotes, em/en dashes, ellipses,
 * ligatures, etc.) with their plain ASCII equivalents. This ensures
 * consistent matching between DB entries and user input regardless of
 * encoding or source formatting.
 *
 * Should be applied both at ingestion (before storing in DB) and at
 * query time (before searching the DB).
 */
export function normalizeText(text: string): string {
  return text
    // Smart/curly single quotes → straight apostrophe
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    // Smart/curly double quotes → straight double quote
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    // Em dash, en dash, figure dash, horizontal bar → hyphen
    .replace(/[\u2013\u2014\u2015\u2012]/g, '-')
    // Ellipsis → three dots
    .replace(/\u2026/g, '...')
    // Non-breaking space, thin space, hair space, etc. → regular space
    .replace(/[\u00A0\u2009\u200A\u202F\u205F]/g, ' ')
    // Zero-width characters (joiners, non-joiners, soft hyphens)
    .replace(/[\u200B\u200C\u200D\u00AD\uFEFF]/g, '')
    // Ligatures
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    // Collapse multiple spaces
    .replace(/ {2,}/g, ' ');
}
