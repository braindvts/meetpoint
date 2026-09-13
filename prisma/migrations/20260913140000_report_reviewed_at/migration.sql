-- Additive only. Current app reads Report.reviewedAt and status indexes.
-- IF NOT EXISTS: live Production rows and columns stay.

ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Report_peerId_createdAt_idx" ON "Report"("peerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Report_reporterId_createdAt_idx" ON "Report"("reporterId", "createdAt");
