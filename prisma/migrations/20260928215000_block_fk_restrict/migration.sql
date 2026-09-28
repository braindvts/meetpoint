-- Safety blocks must survive account deletion. The member row is anonymized, not removed.
-- Replace ON DELETE CASCADE so a later member delete cannot erase Block rows.
-- Report has no foreign key to Member, so it never cascaded.

ALTER TABLE "Block" DROP CONSTRAINT IF EXISTS "Block_blockerId_fkey";
ALTER TABLE "Block" DROP CONSTRAINT IF EXISTS "Block_blockedId_fkey";

DO $$ BEGIN
  ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
