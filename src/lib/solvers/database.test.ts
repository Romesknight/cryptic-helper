import { describe, expect, it } from "vitest";
import { adjustConfidence, clueMatchScore, MIN_MATCH_SCORE } from "./database";

describe("clueMatchScore", () => {
  it("returns 0 for empty input clue", () => {
    expect(clueMatchScore("", "some stored clue")).toBe(0);
  });

  it("returns 0 for empty stored clue", () => {
    expect(clueMatchScore("some input clue", "")).toBe(0);
  });

  it("returns 0 for both empty", () => {
    expect(clueMatchScore("", "")).toBe(0);
  });

  it("returns 0 when only stop words overlap", () => {
    // "the" and "is" are stop words — no meaningful overlap
    expect(clueMatchScore("the cat is here", "the dog is there")).toBeLessThan(
      MIN_MATCH_SCORE
    );
  });

  it("returns 0 when only 1 meaningful word overlaps (below MIN_INTERSECTING_WORDS)", () => {
    // "apparel" is the only shared non-stop word
    expect(
      clueMatchScore(
        "What handyman has flipping spoils apparel",
        "Fashionable apparel"
      )
    ).toBe(0);
  });

  it("returns high score for identical clues", () => {
    const clue = "Crazy leader is more dangerous";
    expect(clueMatchScore(clue, clue)).toBeGreaterThanOrEqual(0.8);
  });

  it("returns high score for near-identical clues (minor punctuation differences)", () => {
    expect(
      clueMatchScore(
        "Crazy leader is more dangerous",
        "Crazy leader is more dangerous (8)"
      )
    ).toBeGreaterThanOrEqual(0.8);
  });

  it("returns moderate score for partial overlap", () => {
    const score = clueMatchScore(
      "broken heart surgery recovery plan",
      "broken heart mended slowly"
    );
    // "broken" and "heart" overlap, other words differ
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.8);
  });

  it("returns 0 for completely unrelated clues", () => {
    expect(
      clueMatchScore(
        "What handyman has flipping spoils apparel",
        "Crazy leader is more dangerous"
      )
    ).toBe(0);
  });

  it("strips punctuation and is case-insensitive", () => {
    const score1 = clueMatchScore("CRAZY Leader", "crazy leader rearranged");
    const score2 = clueMatchScore("crazy leader", "crazy leader rearranged");
    expect(score1).toBe(score2);
  });

  it("filters out stop words from scoring", () => {
    // "the quick brown fox" vs "the slow brown fox"
    // Without stop words: {quick, brown, fox} vs {slow, brown, fox} → 2/4 = 0.5
    // "the" is excluded as a stop word
    const score = clueMatchScore("the quick brown fox", "the slow brown fox");
    expect(score).toBe(2 / 4); // brown, fox shared / quick, brown, fox, slow
  });
});

describe("adjustConfidence", () => {
  it("returns original confidence when score >= 0.8", () => {
    expect(adjustConfidence("high", 0.8)).toBe("high");
    expect(adjustConfidence("medium", 0.9)).toBe("medium");
    expect(adjustConfidence("low", 1.0)).toBe("low");
  });

  it("caps high to medium when score is in [0.6, 0.8)", () => {
    expect(adjustConfidence("high", 0.6)).toBe("medium");
    expect(adjustConfidence("high", 0.7)).toBe("medium");
  });

  it("preserves medium and low when score is in [0.6, 0.8)", () => {
    expect(adjustConfidence("medium", 0.6)).toBe("medium");
    expect(adjustConfidence("low", 0.7)).toBe("low");
  });

  it("returns low for any original when score is in [0.4, 0.6)", () => {
    expect(adjustConfidence("high", 0.4)).toBe("low");
    expect(adjustConfidence("medium", 0.5)).toBe("low");
    expect(adjustConfidence("low", 0.4)).toBe("low");
  });

  it("returns low for scores below 0.4", () => {
    expect(adjustConfidence("high", 0.3)).toBe("low");
    expect(adjustConfidence("high", 0.0)).toBe("low");
  });

  it("handles exact boundary at 0.8", () => {
    expect(adjustConfidence("high", 0.8)).toBe("high");
    expect(adjustConfidence("high", 0.79)).toBe("medium");
  });

  it("handles exact boundary at 0.6", () => {
    expect(adjustConfidence("high", 0.6)).toBe("medium");
    expect(adjustConfidence("high", 0.59)).toBe("low");
  });
});
