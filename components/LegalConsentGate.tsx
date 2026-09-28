"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const OPEN_PATHS = ["/terms", "/privacy", "/contact", "/login", "/verify-email"];

/**
 * Existing and OAuth accounts are not pre-accepted. This gate stays up until the
 * server stores the current Terms and Privacy versions.
 */
export default function LegalConsentGate() {
  const path = usePathname() || "/";
  const [required, setRequired] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setChecked(false);
    void fetch("/api/members/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { legalConsent?: boolean; memberId?: string | null }) => {
        if (cancelled) return;
        setRequired(!!data.memberId && data.legalConsent === false);
      })
      .catch(() => {
        if (!cancelled) setRequired(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!required || OPEN_PATHS.some((item) => path === item || path.startsWith(`${item}/`))) {
    return null;
  }

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    if (!checked) {
      setError("Check the box to continue. It is not selected for you.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/legal/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ acceptTerms: true, acceptPrivacy: true }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || "Could not save your acceptance.");
        return;
      }
      setRequired(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 p-4 sm:items-center">
      <form
        onSubmit={accept}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-gate-title"
        className="w-full max-w-md border border-line bg-[#12110f] p-5 shadow-2xl"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
          Before you continue
        </p>
        <h2 id="legal-gate-title" className="mt-2 text-xl font-semibold text-ivory">
          Accept the Terms
        </h2>
        <p className="mt-2 text-[13px] leading-snug text-muted">
          Interlink needs a record that you agree to the Terms of Service and acknowledge the
          Privacy Policy. This box starts unchecked.
        </p>
        <div className="mt-4 flex items-start gap-3 text-[13px] leading-snug text-ivory">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 accent-[#d4c4a8]"
            aria-describedby="legal-gate-copy"
          />
          <p id="legal-gate-copy">
            I agree to the{" "}
            <Link href="/terms" className="text-accent underline-offset-4 hover:underline">
              Terms of Service
            </Link>{" "}
            and acknowledge the{" "}
            <Link href="/privacy" className="text-accent underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        {error && <p className="mt-3 text-[13px] text-red-300/90">{error}</p>}
        <button
          type="submit"
          disabled={busy || !checked}
          className="mp-btn-lux mt-5 w-full bg-ivory py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink disabled:opacity-40"
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
