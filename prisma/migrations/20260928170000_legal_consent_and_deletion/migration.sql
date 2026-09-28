-- Additive only. Existing member rows keep NULL consent and deletedAt,
-- so current accounts stay intact and are asked to accept on next sign-in.

ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "privacyVersion" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Member_deletedAt_idx" ON "Member"("deletedAt");
