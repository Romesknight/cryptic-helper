/**
 * Scrape real clue explanations from source blog pages (bigdave44,
 * fifteensquared, times_xwd_times, etc.) and cache them as JSON.
 *
 * The eigenfoo indicator data has broken rowid joins, so annotations
 * reference words not in the clue text. This script fetches the actual
 * blog posts where crossword explanations are published and extracts
 * the real annotations.
 *
 * Usage:
 *   npx tsx scripts/scrape-annotations.ts              # Full scrape
 *   npx tsx scripts/scrape-annotations.ts --limit 5    # Test with 5 pages
 *   npx tsx scripts/scrape-annotations.ts --resume     # Skip already-cached clues
 *   npx tsx scripts/scrape-annotations.ts --source bigdave44  # One source only
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { normalizeText } from "../src/lib/utils.js";

// ── Paths ──

const scriptDir = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")
);
const EIGENFOO_DB_PATH = path.join(scriptDir, "data", "cryptics.db");
const LOCAL_DB_PATH = path.join(scriptDir, "data", "clues-local.db");
const ANNOTATIONS_PATH = path.join(scriptDir, "data", "annotations.json");

// ── CLI args ──

const args = process.argv.slice(2);

function getFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function getStringOption(name: string): string | null {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function getNumberOption(name: string): number | null {
  const val = getStringOption(name);
  if (val === null) return null;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? null : n;
}

const RESUME = getFlag("resume");
const PAGE_LIMIT = getNumberOption("limit");
const SOURCE_FILTER = getStringOption("source");

// ── Types ──

interface ClueInfo {
  clue_text: string;
  answer: string;
  source_url: string;
  source: string;
  definition: string;
}

interface AnnotationEntry {
  answer: string;
  annotation: string;
  source: string;
  source_url: string;
}

type AnnotationCache = Record<string, AnnotationEntry>;

// ── Step 1: Build work list from eigenfoo DB ──

function buildWorkList(): ClueInfo[] {
  const dbPath =
    EIGENFOO_DB_PATH.startsWith("/") && process.platform === "win32"
      ? EIGENFOO_DB_PATH.slice(1)
      : EIGENFOO_DB_PATH;

  if (!fs.existsSync(dbPath)) {
    console.error(`Eigenfoo database not found at: ${dbPath}`);
    console.error(
      "Download it first:\n  curl -o scripts/data/cryptics.db https://cryptics.georgeho.org/data.db"
    );
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: true });

  // Get all clues that have source URLs, answers, and definitions
  const rows = db
    .prepare(`
    SELECT
      c.clue,
      c.answer,
      c.source_url,
      c.source,
      c.definition
    FROM clues c
    WHERE c.source_url IS NOT NULL
      AND c.source_url != ''
      AND c.answer IS NOT NULL
      AND c.answer != ''
      AND c.definition IS NOT NULL
      AND c.definition != ''
  `)
    .all() as Array<{
    clue: string;
    answer: string;
    source_url: string;
    source: string;
    definition: string;
  }>;

  db.close();

  // Also check which clues are in our local DB
  const localClueTexts = new Set<string>();
  if (fs.existsSync(LOCAL_DB_PATH)) {
    const localDb = new Database(LOCAL_DB_PATH, { readonly: true });
    const localRows = localDb
      .prepare("SELECT clue_text FROM clues")
      .all() as Array<{ clue_text: string }>;
    for (const r of localRows) {
      localClueTexts.add(r.clue_text.toLowerCase());
    }
    localDb.close();
  }

  // Map eigenfoo clues, filtering to only those in our local DB
  const clues: ClueInfo[] = [];
  for (const row of rows) {
    // Strip HTML, normalize typographic chars to ASCII, then strip enumeration
    const cleanClue = normalizeText(
      row.clue
        .replace(/<[^>]*>/g, "")
        .normalize("NFC")
        // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — strips raw control chars
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .trim()
    )
      .replace(/\s*\(\d+(?:[,-]\d+)*\)\s*$/, "")
      .trim();

    const cleanAnswer = normalizeText(
      row.answer
        .replace(/<[^>]*>/g, "")
        .normalize("NFC")
        // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — strips raw control chars
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .trim()
    )
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    // Only include clues that exist in our local DB (if it exists)
    if (
      localClueTexts.size > 0 &&
      !localClueTexts.has(cleanClue.toLowerCase())
    ) {
      continue;
    }

    clues.push({
      clue_text: cleanClue,
      answer: cleanAnswer,
      source_url: row.source_url.trim(),
      source: (row.source || "").trim(),
      definition: normalizeText(
        row.definition
          .replace(/<[^>]*>/g, "")
          .normalize("NFC")
          // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — strips raw control chars
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .trim()
      ),
    });
  }

  return clues;
}

// ── Step 2: Fetch pages with retry + rate limiting ──

async function fetchPage(url: string, retries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "CrypticHelper/1.0 (educational crossword research)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < retries) {
        const delay = 1000 * 2 ** (attempt - 1); // 1s, 2s, 4s
        console.log(
          `    Retry ${attempt}/${retries} for ${url}: ${msg} (waiting ${delay}ms)`
        );
        await sleep(delay);
      } else {
        console.log(`    FAILED after ${retries} attempts: ${url}: ${msg}`);
        return null;
      }
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Step 3: Parse clue explanations from HTML ──

/**
 * Classify a source URL into a known blog source.
 */
function classifySource(url: string): string {
  if (url.includes("bigdave44")) return "bigdave44";
  if (url.includes("fifteensquared")) return "fifteensquared";
  if (url.includes("times-xwd-times") || url.includes("timesforthetimes"))
    return "times_xwd_times";
  if (url.includes("thehinducrosswordcorner")) return "thehinducrosswordcorner";
  if (url.includes("natpostcryptic")) return "natpostcryptic";
  if (url.includes("newyorker")) return "newyorker";
  return "unknown";
}

/**
 * Strip HTML tags from text, decode common entities, and normalize whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract the annotation for a specific answer from a bigdave44 page.
 *
 * bigdave44 format: Answer in bold/caps, followed by – or — dash, then explanation.
 * Each clue entry is typically in a <p> or a block with the answer emphasized.
 */
function parseBigdave44(html: string, answer: string): string | null {
  // Strategy: find the answer word (often in bold or caps) followed by a dash
  // and grab the explanation text after it.

  // First try: look in the raw HTML for patterns like <strong>ANSWER</strong> – explanation
  // or <b>ANSWER</b> – explanation
  const answerEsc = escapeRegex(answer);

  // Pattern 1: <strong/b>ANSWER</strong/b> followed by dash and explanation
  const htmlPatterns = [
    // Bold answer followed by dash
    new RegExp(
      `<(?:strong|b)[^>]*>\\s*${answerEsc}\\s*</(?:strong|b)>\\s*[–—-]\\s*(.+?)(?=<(?:strong|b)[^>]*>\\s*[A-Z]{2,}|</(?:div|article|section)>|$)`,
      "is"
    ),
    // Answer in caps (not necessarily bold) followed by dash
    new RegExp(
      `(?:^|\\n|<p[^>]*>|<br\\s*\\/?>)\\s*\\d*[a-z]*\\.?\\s*${answerEsc}\\s*[–—-]\\s*(.+?)(?=(?:^|\\n|<p[^>]*>|<br\\s*\\/?>)\\s*\\d*[a-z]*\\.?\\s*[A-Z]{2,}\\s*[–—-]|</(?:div|article|section)>|$)`,
      "is"
    ),
  ];

  for (const pattern of htmlPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const cleaned = stripHtml(match[1]).trim();
      if (cleaned.length >= 10 && cleaned.length <= 500) {
        return cleaned;
      }
    }
  }

  // Fallback: work with stripped text
  const text = stripHtml(html);
  return parseFromPlainText(text, answer);
}

/**
 * Extract annotation from a fifteensquared page.
 *
 * fifteensquared format: Clue number + ANSWER, then clue text on next line,
 * then explanation paragraph(s) below.
 */
function parseFifteensquared(html: string, answer: string): string | null {
  const answerEsc = escapeRegex(answer);

  // Pattern: ANSWER appears with clue number, followed by explanation text
  const htmlPatterns = [
    // Answer in bold/strong followed by explanation
    new RegExp(
      `<(?:strong|b)[^>]*>[^<]*${answerEsc}[^<]*</(?:strong|b)>\\s*(?:<[^>]*>\\s*)*(.+?)(?=<(?:strong|b)[^>]*>\\s*\\d|</(?:div|article|section)>|$)`,
      "is"
    ),
  ];

  for (const pattern of htmlPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const cleaned = stripHtml(match[1]).trim();
      // Take just the first meaningful paragraph as the annotation
      const paragraphs = cleaned
        .split(/\n\n+/)
        .filter((p) => p.trim().length > 10);
      if (paragraphs.length > 0) {
        const annotation = paragraphs[0].trim();
        if (annotation.length >= 10 && annotation.length <= 500) {
          return annotation;
        }
      }
    }
  }

  // Fallback: plain text parsing
  const text = stripHtml(html);
  return parseFromPlainText(text, answer);
}

/**
 * Generic fallback: search for the answer word in the plain text and
 * extract surrounding context as the annotation.
 */
function parseFromPlainText(text: string, answer: string): string | null {
  const answerEsc = escapeRegex(answer);

  // Look for ANSWER followed by a dash and explanation
  const dashPattern = new RegExp(
    `${answerEsc}\\s*[–—-]\\s*(.+?)(?=\\n\\s*[A-Z]{2,}\\s*[–—-]|\\n\\n|$)`,
    "i"
  );
  const dashMatch = text.match(dashPattern);
  if (dashMatch?.[1]) {
    const cleaned = dashMatch[1].trim();
    if (cleaned.length >= 10 && cleaned.length <= 500) {
      return cleaned;
    }
  }

  // Look for answer word in caps, grab the line and next few lines as context
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Check if this line contains the answer prominently
    if (new RegExp(`\\b${answerEsc}\\b`, "i").test(line)) {
      // Check it's not just a bare answer - should have some explanation
      const afterAnswer = line.replace(
        new RegExp(`.*?\\b${answerEsc}\\b\\s*[–—-]?\\s*`, "i"),
        ""
      );
      if (afterAnswer.length >= 10) {
        // Grab this line plus up to 2 more non-empty lines for context
        const contextLines = [afterAnswer];
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.length === 0) break;
          // Stop if we hit the next answer entry
          if (/^[A-Z]{2,}\s*[–—-]/.test(nextLine)) break;
          if (/^\d+[a-z]?\s+[A-Z]{2,}/.test(nextLine)) break;
          contextLines.push(nextLine);
        }
        const result = contextLines.join(" ").trim();
        if (result.length >= 10 && result.length <= 500) {
          return result;
        }
      }
    }
  }

  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract annotation for a clue from page HTML, dispatching to
 * the appropriate parser based on source type.
 */
function extractAnnotation(
  html: string,
  answer: string,
  sourceType: string
): string | null {
  switch (sourceType) {
    case "bigdave44":
      return parseBigdave44(html, answer);
    case "fifteensquared":
      return parseFifteensquared(html, answer);
    case "times_xwd_times":
      return parseFifteensquared(html, answer); // Similar format
    default:
      // Generic fallback for thehinducrosswordcorner, natpostcryptic, etc.
      return parseFromPlainText(stripHtml(html), answer);
  }
}

// ── Step 4: Main orchestration ──

async function main() {
  console.log("\n=== Scrape Annotations from Source Pages ===\n");

  // Build work list
  console.log("Building work list from eigenfoo database...");
  const allClues = buildWorkList();
  console.log(`Found ${allClues.length} clues with source URLs`);

  // Filter by source if requested
  const clues = SOURCE_FILTER
    ? allClues.filter((c) => classifySource(c.source_url) === SOURCE_FILTER)
    : allClues;

  if (SOURCE_FILTER) {
    console.log(
      `Filtered to ${clues.length} clues from source: ${SOURCE_FILTER}`
    );
  }

  // Group clues by source_url
  const pageClues = new Map<string, ClueInfo[]>();
  for (const clue of clues) {
    const existing = pageClues.get(clue.source_url) || [];
    existing.push(clue);
    pageClues.set(clue.source_url, existing);
  }

  const totalPages = pageClues.size;
  console.log(`Grouped into ${totalPages} unique pages\n`);

  // Source distribution
  const sourceCounts = new Map<string, number>();
  for (const clue of clues) {
    const src = classifySource(clue.source_url);
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  }
  console.log("Source distribution:");
  for (const [src, count] of [...sourceCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${src}: ${count} clues`);
  }
  console.log("");

  // Load existing cache if resuming
  let cache: AnnotationCache = {};
  if (RESUME && fs.existsSync(ANNOTATIONS_PATH)) {
    cache = JSON.parse(fs.readFileSync(ANNOTATIONS_PATH, "utf-8"));
    console.log(
      `Loaded ${Object.keys(cache).length} existing annotations from cache`
    );
  }

  // Determine which pages to scrape
  const pagesToScrape: Array<[string, ClueInfo[]]> = [];
  let skippedFromCache = 0;

  for (const [url, pageClueList] of pageClues) {
    if (RESUME) {
      // Skip if ALL clues for this page are already cached
      const allCached = pageClueList.every(
        (c) => cache[c.clue_text.toLowerCase()] !== undefined
      );
      if (allCached) {
        skippedFromCache += pageClueList.length;
        continue;
      }
    }
    pagesToScrape.push([url, pageClueList]);
  }

  if (RESUME && skippedFromCache > 0) {
    console.log(`Skipping ${skippedFromCache} already-cached clues\n`);
  }

  // Apply page limit
  const limitedPages = PAGE_LIMIT
    ? pagesToScrape.slice(0, PAGE_LIMIT)
    : pagesToScrape;
  console.log(`Will scrape ${limitedPages.length} pages...\n`);

  // Scrape pages
  let pagesProcessed = 0;
  let cluesAnnotated = 0;
  let cluesFailed = 0;
  let fetchErrors = 0;

  for (const [url, pageClueList] of limitedPages) {
    pagesProcessed++;
    const sourceType = classifySource(url);
    const progress = `[${pagesProcessed}/${limitedPages.length}]`;

    process.stdout.write(
      `${progress} Fetching ${sourceType}: ${url.slice(0, 80)}...`
    );

    const html = await fetchPage(url);

    if (!html) {
      fetchErrors++;
      console.log(" FETCH FAILED");
      for (const _clue of pageClueList) {
        cluesFailed++;
      }
    } else {
      let pageFound = 0;
      let pageMissed = 0;

      for (const clue of pageClueList) {
        const key = clue.clue_text.toLowerCase();

        // Skip if already cached (even within a partially-cached page)
        if (RESUME && cache[key]) {
          pageFound++;
          continue;
        }

        const annotation = extractAnnotation(html, clue.answer, sourceType);

        if (annotation) {
          cache[key] = {
            answer: clue.answer,
            annotation,
            source: sourceType,
            source_url: url,
          };
          cluesAnnotated++;
          pageFound++;
        } else {
          cluesFailed++;
          pageMissed++;
        }
      }

      console.log(` ${pageFound} found, ${pageMissed} missed`);
    }

    // Be polite: 1-second delay between requests
    if (pagesProcessed < limitedPages.length) {
      await sleep(1000);
    }

    // Save cache periodically (every 50 pages) for crash resilience
    if (pagesProcessed % 50 === 0) {
      fs.writeFileSync(ANNOTATIONS_PATH, JSON.stringify(cache, null, 2));
      console.log(
        `  [checkpoint] Saved ${Object.keys(cache).length} annotations\n`
      );
    }
  }

  // Write final cache
  fs.writeFileSync(ANNOTATIONS_PATH, JSON.stringify(cache, null, 2));

  // Report
  console.log("\n=== Scrape Complete ===");
  console.log(`Pages processed: ${pagesProcessed}`);
  console.log(`Fetch errors: ${fetchErrors}`);
  console.log(`Clues annotated: ${cluesAnnotated}`);
  console.log(`Clues failed to extract: ${cluesFailed}`);
  console.log(`Total cached annotations: ${Object.keys(cache).length}`);
  console.log(`Cache written to: ${ANNOTATIONS_PATH}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
