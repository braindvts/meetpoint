import { rateLimit, type RateLimitResult } from "./rateLimit";

/** Per-IP cap on ADMIN_SECRET guesses at /admin/enter and /api/admin/session. */
export const ADMIN_SECRET_ATTEMPT_LIMIT = 5;
export const ADMIN_SECRET_ATTEMPT_WINDOW_MS = 15 * 60_000;

/**
 * Same call shape as the shared limiter on PR #24 (`rateLimit(req, { name, limit, windowMs })`).
 * This awaits that function. Today it is the in-memory limiter on main. When #24
 * merges, the same call uses the Postgres-backed limiter without a rewrite here.
 */
export async function limitAdminSecretAttempt(req: Request): Promise<RateLimitResult> {
  return rateLimit(req, {
    name: "admin-secret",
    limit: ADMIN_SECRET_ATTEMPT_LIMIT,
    windowMs: ADMIN_SECRET_ATTEMPT_WINDOW_MS,
  });
}
