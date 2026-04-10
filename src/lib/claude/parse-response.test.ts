import { describe, expect, it } from "vitest";
import { parseAnnotation } from "./parse-response";

describe("parseAnnotation", () => {
  it("parses bold text as answer segments", () => {
    const result = parseAnnotation("The answer is **WORD**.");
    expect(result).toEqual([
      { type: "text", content: "The answer is " },
      { type: "answer", content: "WORD" },
      { type: "text", content: "." },
    ]);
  });

  it("parses square brackets as indicator segments", () => {
    const result = parseAnnotation("[broken] signals anagram");
    expect(result).toEqual([
      { type: "indicator", content: "broken" },
      { type: "text", content: " signals anagram" },
    ]);
  });

  it("parses curly braces as deleted segments", () => {
    const result = parseAnnotation("TRI{UMPH} loses letters");
    expect(result).toEqual([
      { type: "text", content: "TRI" },
      { type: "deleted", content: "UMPH" },
      { type: "text", content: " loses letters" },
    ]);
  });

  it("parses parentheses as explanation segments", () => {
    const result = parseAnnotation("word (meaning something)");
    expect(result).toEqual([
      { type: "text", content: "word " },
      { type: "explanation", content: "meaning something" },
    ]);
  });

  it("skips letter pattern parentheses like (7) or (4,3)", () => {
    const result = parseAnnotation("clue (7) end");
    expect(result).toEqual([{ type: "text", content: "clue (7) end" }]);
  });

  it("handles mixed notation", () => {
    const result = parseAnnotation(
      "ANAGRAM: **DEADLIER** — [Crazy] rearranges (more dangerous)"
    );
    expect(result).toHaveLength(6);
    expect(result[0]).toEqual({ type: "text", content: "ANAGRAM: " });
    expect(result[1]).toEqual({ type: "answer", content: "DEADLIER" });
    expect(result[2]).toEqual({ type: "text", content: " — " });
    expect(result[3]).toEqual({ type: "indicator", content: "Crazy" });
    expect(result[4]).toEqual({ type: "text", content: " rearranges " });
    expect(result[5]).toEqual({
      type: "explanation",
      content: "more dangerous",
    });
  });

  it("handles empty string", () => {
    const result = parseAnnotation("");
    expect(result).toEqual([]);
  });

  it("handles plain text with no notation", () => {
    const result = parseAnnotation("Just plain text");
    expect(result).toEqual([{ type: "text", content: "Just plain text" }]);
  });
});
