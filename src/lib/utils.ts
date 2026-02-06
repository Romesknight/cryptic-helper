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
