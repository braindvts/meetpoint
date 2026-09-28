-- Real-member profile fields and structured interests.
-- Additive only: new columns, a join table, and a flag on existing sample rows.
-- Does not delete members, events, or RSVPs.

ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "company" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "industry" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "isSample" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "sampleKind" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS "Member_isSample_idx" ON "Member"("isSample");

CREATE TABLE IF NOT EXISTS "MemberInterest" (
    "memberId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "MemberInterest_pkey" PRIMARY KEY ("memberId", "slug")
);

CREATE INDEX IF NOT EXISTS "MemberInterest_slug_idx" ON "MemberInterest"("slug");

DO $$ BEGIN
  ALTER TABLE "MemberInterest"
    ADD CONSTRAINT "MemberInterest_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Mark known sample / guest / bot rows so matching can skip them.
-- Leaves the rows in place. Removal is scripts/cleanup-sample-accounts.ts --apply.
UPDATE "Member"
SET
  "isSample" = true,
  "sampleKind" = CASE
    WHEN "id" IN (
      'p1','p2','p3','p4','p5','p6','p7','p8','p9','p10',
      'p11','p12','p13','p14','p15','p16','p17','p18'
    ) THEN 'seed'
    WHEN "verificationsJson" ILIKE '%conclave-demo%'
      OR COALESCE("linkedInId", '') ILIKE '%conclave-demo%'
      OR COALESCE("email", '') ILIKE '%@conclave.app' THEN 'guest'
    WHEN "photo" ILIKE '%randomuser.me%' THEN 'bot'
    ELSE 'sample'
  END
WHERE "isSample" = false
  AND (
    "id" IN (
      'p1','p2','p3','p4','p5','p6','p7','p8','p9','p10',
      'p11','p12','p13','p14','p15','p16','p17','p18'
    )
    OR "verificationsJson" ILIKE '%conclave-demo%'
    OR COALESCE("linkedInId", '') ILIKE '%conclave-demo%'
    OR COALESCE("email", '') ILIKE '%@conclave.app'
    OR "photo" ILIKE '%randomuser.me%'
  );
