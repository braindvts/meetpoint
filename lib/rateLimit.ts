import { NextResponse } from "next/server";
import { clientIp } from "@/lib/validation/parse";

type Bucket = { count: number; resetAt: number };

/** Best-effort in-memory limiter (per isolate on Vercel). */
const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * Sliding window rate limit. Key = route + IP (or custom).
 * Optional Upstash later: set UPSTASH_REDIS_REST_URL + TOKEN.
 */
export function rateLimit(
  req: Request,
  opts: { name: string; limit: number; windowMs: number; keyExtra?: string }
): RateLimitResult {
  const ip = clientIp(req);
  const key = `${opts.name}:${ip}${opts.keyExtra ? `:${opts.keyExtra}` : ""}`;
  const now = Date.now();
  let row = buckets.get(key);

  if (!row || now >= row.resetAt) {
    row = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(key, row);
  }

  row.count += 1;
  if (row.count > opts.limit) {
    const retry = Math.max(1, Math.ceil((row.resetAt - now) / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Too many requests. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(retry) },
        }
      ),
    };
  }

  // Opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k);
    }
  }

  return { ok: true };
}
