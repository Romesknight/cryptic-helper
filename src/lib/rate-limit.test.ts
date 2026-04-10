import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows first request", () => {
    const result = checkRateLimit("test-ip-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it("allows up to 20 requests per minute", () => {
    const ip = "test-ip-2";
    for (let i = 0; i < 20; i++) {
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 21st request", () => {
    const ip = "test-ip-3";
    for (let i = 0; i < 20; i++) {
      checkRateLimit(ip);
    }
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    const ip = "test-ip-4";
    for (let i = 0; i < 20; i++) {
      checkRateLimit(ip);
    }

    // Advance past the window
    vi.advanceTimersByTime(61000);

    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
  });
});
