/** Shared report labels — safe for client components (no Zod). */

/**
 * Member-facing reasons plus legacy slugs already stored in Production
 * (`fake_profile`, `scam`, `other`). Do not drop the legacy slugs — the
 * report/block work on another branch still accepts them.
 */
export const REPORT_CATEGORIES = [
  "harassment",
  "spam",
  "fraud",
  "impersonation",
  "inappropriate",
  "suspicious_account",
  "fake_profile",
  "scam",
  "other",
] as const;

/** Shown in the report dialog. Legacy slugs stay valid on the API. */
export const REPORT_DIALOG_CATEGORIES = [
  "harassment",
  "spam",
  "fraud",
  "impersonation",
  "inappropriate",
  "suspicious_account",
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
  harassment: "Harassment",
  spam: "Spam",
  fraud: "Fraud",
  impersonation: "Impersonation",
  inappropriate: "Inappropriate content",
  suspicious_account: "Suspicious account",
  fake_profile: "Fake or misleading profile",
  scam: "Scam or fraud",
  other: "Something else",
};
