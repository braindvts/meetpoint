-- Baseline the live EventInterest table so Prisma can read and write RSVPs.
-- The table already exists on production and is also created by
-- 20260913040000_event_interest. This migration is a no-op in both cases.
-- It does not remove, rename, retype, or rewrite existing rows.
-- Another branch may add the same model; IF NOT EXISTS keeps either order safe.

CREATE TABLE IF NOT EXISTS "EventInterest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EventInterest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventInterest_memberId_idx" ON "EventInterest"("memberId");
CREATE UNIQUE INDEX IF NOT EXISTS "EventInterest_memberId_eventId_key" ON "EventInterest"("memberId", "eventId");

DO $$ BEGIN
  ALTER TABLE "EventInterest"
    ADD CONSTRAINT "EventInterest_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
