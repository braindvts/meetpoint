import { rateLimit, type RateLimitResult } from "./rateLimit";

/** Per-IP cap on ADMIN_SECRET guesses at /admin/enter and /api/admin/session. */
export const ADMIN_SECRET_ATTEMPT_LIMIT = 5;
export const ADMIN_SECRET_ATTEMPT_WINDOW_MS = 15 * 60_000;

/**
 * Postgres-backed cap (`RateLimitBucket`), with the in-memory fallback inside
 * `rateLimit` when the database is unavailable. Shared bucket "admin-secret".
 */
export async function limitAdminSecretAttempt(req: Request): Promise<RateLimitResult> {
  return await rateLimit(req, {
    name: "admin-secret",
    limit: ADMIN_SECRET_ATTEMPT_LIMIT,
    windowMs: ADMIN_SECRET_ATTEMPT_WINDOW_MS,
  });
}
