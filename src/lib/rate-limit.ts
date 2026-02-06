import { RATE_LIMIT } from './constants';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check if a request from the given IP is rate-limited.
 * Returns { allowed: true } if under the limit, or { allowed: false, retryAfter } if over.
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
} {
  const now = Date.now();
  const entry = store.get(ip);

  // Clean up expired entries periodically
  if (store.size > 10000) {
    for (const [key, val] of store) {
      if (val.resetAt < now) store.delete(key);
    }
  }

  if (!entry || entry.resetAt < now) {
    // Start a new window
    store.set(ip, { count: 1, resetAt: now + RATE_LIMIT.WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT.MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS - entry.count };
}
