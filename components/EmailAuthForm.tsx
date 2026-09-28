"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmailCheckPanel } from "@/components/EmailCheckPanel";
import { safeAppPath } from "@/lib/appPath";
import { clearDemoOwnerSession, markDemoOwnerSession } from "@/lib/demoFlag";
import { saveProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

export default function EmailAuthForm({ next }: { next?: string | null }) {
  const searchParams = useSearchParams();
  const requestedNext = safeAppPath(next) || safeAppPath(searchParams.get("next"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [continueTo, setContinueTo] = useState("/onboarding");

  async function finishAuth(data: {
    ok?: boolean;
    error?: string;
    next?: string;
    demoOwner?: boolean;
    profile?: MyProfile | null;
  }) {
    if (!data.ok) {
      setError(data.error || "Could not sign in.");
      return;
    }
    if (data.profile?.name) {
      saveProfile(data.profile);
    }
    if (data.demoOwner) {
      markDemoOwnerSession();
    } else {
      clearDemoOwnerSession();
    }
    const dest = safeAppPath(data.next) || requestedNext || "/discover";
    if (mode === "signup") {
      setConfirmEmail(email.trim());
      setContinueTo(dest);
      return;
    }
    window.location.href = dest;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && (!acceptTerms || !acceptPrivacy)) {
      setError("Agree to the Terms and acknowledge the Privacy Policy. The boxes start unchecked.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          name,
          mode,
          ...(requestedNext ? { next: requestedNext } : {}),
          ...(mode === "signup" ? { acceptTerms, acceptPrivacy } : {}),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        next?: string;
        demoOwner?: boolean;
        profile?: MyProfile | null;
      };
      await finishAuth(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-line/80 bg-ink/60 px-3 py-2 text-[14px] text-ivory outline-none placeholder:text-muted/55 focus:border-accent";

  if (confirmEmail) {
    return (
      <EmailCheckPanel
        email={confirmEmail}
        onContinue={() => {
          window.location.href = continueTo;
        }}
      />
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setAcceptTerms(false);
            setAcceptPrivacy(false);
          }}
          className={mode === "signin" ? "text-accent" : "text-muted"}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setAcceptTerms(false);
            setAcceptPrivacy(false);
          }}
          className={mode === "signup" ? "text-accent" : "text-muted"}
        >
          Create account
        </button>
      </div>

      {mode === "signup" && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
          className={field}
        />
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="email"
        required
        className={field}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={mode === "signup" ? "Password (8+)" : "Password"}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        required
        minLength={8}
        className={field}
      />
      {mode === "signup" && (
        <div className="space-y-2 text-[12px] leading-snug text-muted">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 accent-[#d4c4a8]"
              aria-describedby="signup-terms"
            />
            <p id="signup-terms">
              I agree to the{" "}
              <Link href="/terms" className="text-accent underline-offset-4 hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-0.5 accent-[#d4c4a8]"
              aria-describedby="signup-privacy"
            />
            <p id="signup-privacy">
              I acknowledge the{" "}
              <Link href="/privacy" className="text-accent underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      )}
      {error && <p className="text-[13px] text-red-300/90">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mp-btn-lux w-full rounded-lg bg-ivory py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-40"
      >
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
