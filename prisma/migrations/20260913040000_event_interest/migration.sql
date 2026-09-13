-- Tables RSVP / save / pass. Idempotent for live DBs that already have EventInterest.

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
  ALTER TABLE "EventInterest" ADD CONSTRAINT "EventInterest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
