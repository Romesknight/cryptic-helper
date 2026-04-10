"use client";

import {
  type AnnotationSegment,
  parseAnnotation,
} from "@/lib/claude/parse-response";

interface AnnotatedClueProps {
  annotation: string;
  className?: string;
}

/**
 * Renders a cryptic clue annotation with styled notation.
 * Parses **bold**, [brackets], {curly}, and (parens) into colored spans.
 */
export default function AnnotatedClue({
  annotation,
  className,
}: AnnotatedClueProps) {
  const segments = parseAnnotation(annotation);

  return (
    <p className={className}>
      {segments.map((segment, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: segments are static derived data, never reordered
        <AnnotationSpan key={i} segment={segment} />
      ))}
    </p>
  );
}

function AnnotationSpan({ segment }: { segment: AnnotationSegment }) {
  switch (segment.type) {
    case "answer":
      return <strong className="annotation-answer">{segment.content}</strong>;
    case "indicator":
      return <span className="annotation-indicator">[{segment.content}]</span>;
    case "deleted":
      return <span className="annotation-deleted">{segment.content}</span>;
    case "explanation":
      return (
        <span className="annotation-explanation">({segment.content})</span>
      );
    default:
      return <span>{segment.content}</span>;
  }
}
