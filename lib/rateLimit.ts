import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { consumeBucket } from "@/lib/safetyRules";
import { clientIp } from "@/lib/validation/parse";

type Bucket = { count: number; resetAt: number };

/**
 * Limits live in Postgres (`RateLimitBucket`) so they are shared by every
 * Vercel serverless isolate. A process-local map is only the fallback when
 * the database is unreachable — it still slows a single isolate, but it is
 * not the limit that protects production.
 */
const memoryBuckets = new Map<string, Bucket>();
let memoryFallbackWarned = false;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

export type RateLimitOptions = {
  name: string;
  limit: number;
  windowMs: number;
  /** Hashed account id or email. Ignored for IP scope. */
  keyExtra?: string;
  /** "account" counts across all IPs. Default is per IP. */
  scope?: "ip" | "account";
};

/** Stable non-reversible key fragment. Do not store raw emails in the bucket table. */
export function accountKey(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export function rateLimitStorageKey(ip: string, opts: RateLimitOptions): string {
  if (opts.scope === "account") {
    return `${opts.name}:acct:${opts.keyExtra || "anon"}`;
  }
  return `${opts.name}:ip:${ip}`;
}

async function hitDatabase(
  key: string,
  windowMs: number
): Promise<{ count: number; resetAt: number }> {
  const resetAt = new Date(Date.now() + windowMs);
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "resetAt"
  `;
  const row = rows[0];
  if (!row) throw new Error("rate limit upsert returned no row");
  return { count: Number(row.count), resetAt: new Date(row.resetAt).getTime() };
}

function hitMemory(key: string, limit: number, windowMs: number, now: number) {
  return consumeBucket(memoryBuckets, key, limit, windowMs, now);
}

export async function rateLimit(
  req: Request,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const ip = clientIp(req);
  const key = rateLimitStorageKey(ip, opts);
  const now = Date.now();

  let count = 0;
  let resetAt = now + opts.windowMs;
  try {
    if (!process.env.DATABASE_URL) throw new Error("no database");
    const hit = await hitDatabase(key, opts.windowMs);
    count = hit.count;
    resetAt = hit.resetAt;
    if (Math.random() < 0.02) {
      void prisma.rateLimitBucket
        .deleteMany({ where: { resetAt: { lt: new Date() } } })
        .catch(() => undefined);
    }
  } catch {
    if (!memoryFallbackWarned) {
      memoryFallbackWarned = true;
      console.error("[rate-limit] database unavailable, using isolate memory");
    }
    const mem = hitMemory(key, opts.limit, opts.windowMs, now);
    if (!mem.allowed) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: "Too many requests. Try again shortly." },
          { status: 429, headers: { "Retry-After": String(mem.retryAfterSec) } }
        ),
      };
    }
    return { ok: true };
  }

  if (count > opts.limit) {
    const retry = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Too many requests. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(retry) } }
      ),
    };
  }

  return { ok: true };
}

export async function rateLimits(
  req: Request,
  rules: RateLimitOptions[]
): Promise<RateLimitResult> {
  for (const rule of rules) {
    const result = await rateLimit(req, rule);
    if (!result.ok) return result;
  }
  return { ok: true };
}
