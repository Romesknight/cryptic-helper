/**
 * Post-process scraped annotations to fix common issues and discard garbage.
 *
 * Runs during build-local-db.ts on any annotation entry that hasn't been
 * cleaned yet (missing `cleaned: true`). Results are persisted back to the
 * JSON cache so each entry is only processed once.
 *
 * Categories handled:
 *   - NORMALIZE: cache keys (clue text) normalized to plain ASCII
 *   - FIX: HTML entity leftovers, trailing clue bleed
 *   - DISCARD: CSS/code artifacts, blog commentary, tiny fragments
 */

import { normalizeText } from '../../src/lib/utils.js';

export interface AnnotationEntry {
  answer: string;
  annotation: string;
  source: string;
  source_url: string;
  cleaned?: boolean;
  discarded?: boolean;
  discard_reason?: string;
}

export type AnnotationCache = Record<string, AnnotationEntry>;

// ── Detection patterns ──

/** CSS/HTML/JS code artifacts that leaked into the annotation. */
const CSS_CODE_PATTERNS = [
  /position\s*:/i,
  /overflow\s*:/i,
  /inset\s*\(/i,
  /width\s*:\s*\d/i,
  /height\s*:\s*\d/i,
  /padding\s*:\s*\d/i,
  /margin\s*:\s*[-\d]/i,
  /display\s*:\s*(?:none|block|flex|inline)/i,
  /font-size\s*:/i,
  /background\s*:/i,
  /z-index\s*:/i,
  /\.(?:css|js|php)\b/i,
  /function\s*\(/,
  /var\s+\w+\s*=/,
  /<script/i,
  /<style/i,
];

/** Blog commentary — first-person hedging from commenters, not the author. */
const COMMENTARY_PATTERNS = [
  /\bI couldn'?t\b/i,
  /\bI'?m not sure\b/i,
  /\bthanks for explaining\b/i,
  /\bI didn'?t (?:get|understand)\b/i,
  /\bcan someone explain\b/i,
  /\bI struggled with\b/i,
  /\bI don'?t understand\b/i,
  /\bmy (?:last|final) one in\b/i,
  /\bI thought this was\b/i,
];

/** Trailing clue bleed — next clue entry leaked into this annotation. */
const CLUE_BLEED_PATTERN = /\n?\s*\d+[ad]?\s+[A-Z][a-zA-Z\s,'()-]+\(\d+(?:[,-]\d+)*\)/;

/** Alternate clue bleed — "14d  ANSWER – explanation" pattern from next entry. */
const NEXT_ENTRY_PATTERN = /\n?\s*\d+[ad]?\s{2,}[A-Z]{2,}\s*[–—-]/;

/** HTML entities that weren't decoded. */
const HTML_ENTITY_MAP: Record<string, string> = {
  '&#8230;': '...',
  '&#8217;': "'",
  '&#8216;': "'",
  '&#8220;': '\u201c',
  '&#8221;': '\u201d',
  '&#8211;': '\u2013',
  '&#8212;': '\u2014',
  '&#039;': "'",
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&rsquo;': "'",
  '&lsquo;': "'",
  '&rdquo;': '\u201d',
  '&ldquo;': '\u201c',
  '&ndash;': '\u2013',
  '&mdash;': '\u2014',
  '&nbsp;': ' ',
  '&#160;': ' ',
};

// ── Fix functions ──

/** Decode any remaining HTML entities. */
function fixHtmlEntities(text: string): string {
  let result = text;
  for (const [entity, replacement] of Object.entries(HTML_ENTITY_MAP)) {
    result = result.replaceAll(entity, replacement);
  }
  // Catch any remaining numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  return result;
}

/** Remove trailing clue bleed (next clue entry appended to this one). */
function fixTrailingClueBleed(text: string): string {
  let result = text.replace(CLUE_BLEED_PATTERN, '');
  result = result.replace(NEXT_ENTRY_PATTERN, '');
  return result.trim();
}

/** Strip leading punctuation fragments (e.g. starting with ": " or ", "). */
function fixLeadingFragment(text: string): string {
  return text.replace(/^[\s:,;.–—-]+/, '').trim();
}

// ── Discard checks ──

interface DiscardResult {
  discarded: boolean;
  reason: string;
}

function checkForGarbage(annotation: string): DiscardResult {
  // CSS/code artifacts
  for (const pattern of CSS_CODE_PATTERNS) {
    if (pattern.test(annotation)) {
      return { discarded: true, reason: 'css_code_artifact' };
    }
  }

  // Blog commentary
  for (const pattern of COMMENTARY_PATTERNS) {
    if (pattern.test(annotation)) {
      return { discarded: true, reason: 'blog_commentary' };
    }
  }

  // Too short to be useful (< 15 chars after cleanup)
  if (annotation.length < 15) {
    return { discarded: true, reason: 'too_short' };
  }

  // Mostly non-alphanumeric (likely garbage)
  const alphaCount = (annotation.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount / annotation.length < 0.4) {
    return { discarded: true, reason: 'low_alpha_ratio' };
  }

  return { discarded: false, reason: '' };
}

// ── Main cleaner ──

/**
 * Clean all uncleaned entries in the annotation cache.
 *
 * Mutates entries in place, adding `cleaned: true` and optionally
 * `discarded: true` with `discard_reason`.
 *
 * @returns Stats about what was cleaned.
 */
export function cleanAnnotations(cache: AnnotationCache): {
  alreadyClean: number;
  fixed: number;
  discarded: number;
  discardReasons: Record<string, number>;
} {
  let alreadyClean = 0;
  let fixed = 0;
  let discarded = 0;
  const discardReasons: Record<string, number> = {};

  for (const [key, entry] of Object.entries(cache)) {
    if (entry.cleaned) {
      alreadyClean++;
      continue;
    }

    // Apply fixes
    let annotation = entry.annotation;
    annotation = fixHtmlEntities(annotation);
    annotation = fixTrailingClueBleed(annotation);
    annotation = fixLeadingFragment(annotation);

    // Check for garbage
    const result = checkForGarbage(annotation);

    if (result.discarded) {
      entry.annotation = annotation;
      entry.cleaned = true;
      entry.discarded = true;
      entry.discard_reason = result.reason;
      discarded++;
      discardReasons[result.reason] = (discardReasons[result.reason] ?? 0) + 1;
    } else {
      entry.annotation = annotation;
      entry.cleaned = true;
      fixed++;
    }
  }

  return { alreadyClean, fixed, discarded, discardReasons };
}

/**
 * Normalize all cache keys (clue text) to plain ASCII.
 *
 * Smart quotes, em dashes, etc. in keys are replaced with their ASCII
 * equivalents so they match the normalized clue text stored in the DB.
 * If normalization produces a duplicate key, the existing entry is kept.
 *
 * @returns A new cache with normalized keys and the count of keys renamed.
 */
export function normalizeCacheKeys(cache: AnnotationCache): {
  normalized: AnnotationCache;
  keysRenamed: number;
} {
  const normalized: AnnotationCache = {};
  let keysRenamed = 0;

  for (const [key, entry] of Object.entries(cache)) {
    const newKey = normalizeText(key);
    if (newKey !== key) {
      keysRenamed++;
    }
    // Keep first occurrence if there are duplicate normalized keys
    if (!normalized[newKey]) {
      normalized[newKey] = entry;
    }
  }

  return { normalized, keysRenamed };
}
