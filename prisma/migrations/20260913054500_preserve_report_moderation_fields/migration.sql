-- Production already has these Report columns (with data).
-- Additive only: never DROP. IF NOT EXISTS keeps a live database intact
-- and fills in a fresh database that was created from the slim Report model.
-- Do not run this via `prisma db push` with --accept-data-loss.

ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "alsoBlocked" BOOLEAN NOT NULL DEFAULT false;
