/** Shared report labels — safe for client components (no Zod). */

export const REPORT_CATEGORIES = [
  "harassment",
  "spam",
  "fake_profile",
  "inappropriate",
  "scam",
  "other",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const REPORT_STATUSES = [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  harassment: "Harassment or threats",
  spam: "Spam or solicitation",
  fake_profile: "Fake or misleading profile",
  inappropriate: "Inappropriate behavior",
  scam: "Scam or fraud",
  other: "Something else",
};
