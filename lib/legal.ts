/**
 * Legal document versions. Bump either constant when the published draft changes
 * in a way that needs a fresh acceptance. Existing members are prompted again.
 */
export const TERMS_VERSION = "2026-09-28-draft";
export const PRIVACY_VERSION = "2026-09-28-draft-5";

/** Facts the repo does not establish. Do not replace these with invented values. */
export const LEGAL_ENTITY_PLACEHOLDER = "[LEGAL ENTITY NAME]";
export const LEGAL_JURISDICTION_PLACEHOLDER = "[JURISDICTION]";
export const LEGAL_CONTACT_PLACEHOLDER = "[CONTACT EMAIL]";
export const LEGAL_SAFETY_CONTACT_PLACEHOLDER = "[SAFETY CONTACT EMAIL]";

export interface LegalConsentRecord {
  termsAcceptedAt: Date | null;
  termsVersion: string | null;
  privacyAcceptedAt: Date | null;
  privacyVersion: string | null;
}

export function hasCurrentLegalConsent(
  member: LegalConsentRecord | null | undefined
): boolean {
  if (!member) return false;
  if (!(member.termsAcceptedAt instanceof Date)) return false;
  if (!(member.privacyAcceptedAt instanceof Date)) return false;
  if (Number.isNaN(member.termsAcceptedAt.getTime())) return false;
  if (Number.isNaN(member.privacyAcceptedAt.getTime())) return false;
  return (
    member.termsVersion === TERMS_VERSION && member.privacyVersion === PRIVACY_VERSION
  );
}

export function legalConsentStamp(now = new Date()) {
  return {
    termsAcceptedAt: now,
    termsVersion: TERMS_VERSION,
    privacyAcceptedAt: now,
    privacyVersion: PRIVACY_VERSION,
  };
}
