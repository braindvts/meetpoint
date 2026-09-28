import { NextResponse } from "next/server";
import { hasCurrentLegalConsent, type LegalConsentRecord } from "@/lib/legal";

/** Block product APIs until the current Terms and Privacy versions are stored. */
export function legalConsentDenied(
  member: LegalConsentRecord | null | undefined
): NextResponse | null {
  if (hasCurrentLegalConsent(member)) return null;
  return NextResponse.json(
    {
      ok: false,
      code: "legal_consent_required",
      error: "Accept the Terms of Service and acknowledge the Privacy Policy to continue.",
    },
    { status: 403 }
  );
}
