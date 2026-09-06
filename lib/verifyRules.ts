import type { Verification, VerificationMethod } from "./types";

export function validateVerification(
  method: VerificationMethod,
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Enter your verification detail." };

  if (method === "company-email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { ok: false, error: "Enter a valid email address." };
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

  if (method === "resume" || method === "website" || method === "portfolio") {
    if (!/^https?:\/\/[^\s]+\.[^\s]+/i.test(value)) {
      return {
        ok: false,
        error:
          method === "resume"
            ? "Enter a resume link starting with https:// (PDF, Drive, Dropbox)."
            : "Enter a full URL starting with https://",
      };
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
