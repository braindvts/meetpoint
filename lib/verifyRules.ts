import type { Verification, VerificationMethod } from "./types";

const PERSONAL_EMAIL = /@(gmail|yahoo|hotmail|outlook|icloud|aol|mail|proton)\./i;

export function validateVerification(
  method: VerificationMethod,
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Enter your verification detail." };

  if (method === "company-email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { ok: false, error: "Enter a valid company email address." };
    }
    if (PERSONAL_EMAIL.test(value)) {
      return { ok: false, error: "Use a company email — personal addresses aren’t accepted." };
    }
    return { ok: true, value: value.toLowerCase() };
  }

  if (method === "linkedin") {
    if (value.startsWith("linkedin:")) return { ok: true, value };
    if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/[\w%-]+\/?$/i.test(value)) {
      return { ok: false, error: "Enter a public LinkedIn URL (linkedin.com/in/…)." };
    }
    return { ok: true, value };
  }

  if (method === "website" || method === "portfolio") {
    if (!/^https?:\/\/[^\s]+\.[^\s]+/i.test(value)) {
      return { ok: false, error: "Enter a full URL starting with https://" };
    }
    return { ok: true, value };
  }

  if (method === "registration") {
    if (value.length < 4) {
      return { ok: false, error: "Enter a company number or registry ID." };
    }
    return { ok: true, value };
  }

  return { ok: true, value };
}

export function makeVerification(
  method: VerificationMethod,
  value: string
): Verification {
  return { method, value, verifiedAt: new Date().toISOString() };
}
