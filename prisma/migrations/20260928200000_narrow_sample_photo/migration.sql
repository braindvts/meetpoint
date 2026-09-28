-- 20260928160000 marked every photo that contained randomuser.me as a bot.
-- Only the exact seed portrait is a sample:
--   https://randomuser.me/api/portraits/(men|women)/<n>.jpg with n from 0 to 99.
-- A real member whose photo merely mentions that host is not a sample.

UPDATE "Member"
SET "isSample" = false,
    "sampleKind" = ''
WHERE "sampleKind" = 'bot'
  AND "id" NOT IN (
    'p1','p2','p3','p4','p5','p6','p7','p8','p9','p10',
    'p11','p12','p13','p14','p15','p16','p17','p18'
  )
  AND lower(COALESCE("email", '')) <> 'demo@conclave.app'
  AND "verificationsJson" NOT ILIKE '%conclave-demo%'
  AND COALESCE("linkedInId", '') NOT ILIKE '%conclave-demo%'
  AND COALESCE("photo", '') !~* '^https://randomuser\.me/api/portraits/(men|women)/([1-9][0-9]?|0)\.jpg$';
