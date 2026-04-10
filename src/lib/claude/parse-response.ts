/**
 * Parse annotation notation into an array of styled segments.
 *
 * Notation:
 * - **text** → answer component (bold, emerald)
 * - [text] → wordplay indicator (amber)
 * - {text} → deleted/omitted letters (gray, strikethrough)
 * - (text) → explanation (blue, italic) — skips letter patterns like (7) or (4,3)
 */

export interface AnnotationSegment {
  type: "text" | "answer" | "indicator" | "deleted" | "explanation";
  content: string;
}

/**
 * Parse an annotation string into styled segments.
 */
export function parseAnnotation(annotation: string): AnnotationSegment[] {
  const segments: AnnotationSegment[] = [];
  let remaining = annotation;

  while (remaining.length > 0) {
    // Find the next special token
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const bracketMatch = remaining.match(/\[(.+?)\]/);
    const curlyMatch = remaining.match(/\{(.+?)\}/);
    const parenMatch = remaining.match(/\((.+?)\)/);

    // Find the earliest match
    const candidates: Array<{
      index: number;
      fullMatch: string;
      content: string;
      type: AnnotationSegment["type"];
    }> = [];

    if (boldMatch?.index !== undefined) {
      candidates.push({
        index: boldMatch.index,
        fullMatch: boldMatch[0],
        content: boldMatch[1],
        type: "answer",
      });
    }

    if (bracketMatch?.index !== undefined) {
      candidates.push({
        index: bracketMatch.index,
        fullMatch: bracketMatch[0],
        content: bracketMatch[1],
        type: "indicator",
      });
    }

    if (curlyMatch?.index !== undefined) {
      candidates.push({
        index: curlyMatch.index,
        fullMatch: curlyMatch[0],
        content: curlyMatch[1],
        type: "deleted",
      });
    }

    if (parenMatch?.index !== undefined) {
      // Skip if it's a letter pattern like (7) or (4,3)
      const isLetterPattern = /^\(\d[\d,\s-]*\)$/.test(parenMatch[0]);
      if (!isLetterPattern) {
        candidates.push({
          index: parenMatch.index,
          fullMatch: parenMatch[0],
          content: parenMatch[1],
          type: "explanation",
        });
      }
    }

    if (candidates.length === 0) {
      // No more special tokens — rest is plain text
      if (remaining.length > 0) {
        segments.push({ type: "text", content: remaining });
      }
      break;
    }

    // Use the earliest match
    candidates.sort((a, b) => a.index - b.index);
    const earliest = candidates[0];

    // Add text before the match
    if (earliest.index > 0) {
      segments.push({
        type: "text",
        content: remaining.slice(0, earliest.index),
      });
    }

    // Add the matched segment
    segments.push({
      type: earliest.type,
      content: earliest.content,
    });

    // Advance past the match
    remaining = remaining.slice(earliest.index + earliest.fullMatch.length);
  }

  return segments;
}
