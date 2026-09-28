-- 20260928160000 marked every @conclave.app address as a guest sample.
-- Only the known demo mailbox is a sample. Other addresses on that domain stay real members.
-- Seed ids, the conclave-demo marker, and randomuser.me photos are unchanged.

UPDATE "Member"
SET "isSample" = false,
    "sampleKind" = ''
WHERE "sampleKind" = 'guest'
  AND lower(COALESCE("email", '')) LIKE '%@conclave.app'
  AND lower(COALESCE("email", '')) <> 'demo@conclave.app'
  AND "id" NOT IN (
    'p1','p2','p3','p4','p5','p6','p7','p8','p9','p10',
    'p11','p12','p13','p14','p15','p16','p17','p18'
  )
  AND "verificationsJson" NOT ILIKE '%conclave-demo%'
  AND COALESCE("linkedInId", '') NOT ILIKE '%conclave-demo%'
  AND COALESCE("photo", '') NOT ILIKE '%randomuser.me%';
