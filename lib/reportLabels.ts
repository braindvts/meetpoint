/** Shared report labels — safe for client components (no Zod). */

/**
 * Same Report.category string as PR #24. No second report table.
 * That PR already accepts harassment, spam, fake_profile, inappropriate,
 * scam, and other. It does not include fraud, impersonation, or
 * suspicious_account, so those slugs are added here. Keep every PR #24 slug
 * valid. Admin review stays on requireAdmin, which PR #24 wraps as
 * requireReportAdmin. PR #25's canViewAdminDashboard belongs inside that
 * wrapper. This file does not add another admin check.
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
