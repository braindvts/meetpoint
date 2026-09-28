"use client";

import { useEffect, useState } from "react";

const field =
  "w-full rounded-lg border border-line/80 bg-ink/60 px-3 py-2 text-[14px] text-ivory outline-none placeholder:text-muted/55 focus:border-accent";

export function EmailCheckPanel({
  email,
  onContinue,
}: {
  email: string;
  onContinue?: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/auth/email/resend", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; alreadyVerified?: boolean };
      if (data.alreadyVerified) setNote("This email is already confirmed.");
      else if (data.ok) setNote("Sent again. The link expires in 24 hours.");
      else setNote(data.error || "Could not resend.");
    } catch {
      setNote("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 text-[13px] leading-snug text-muted">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        Check your email
      </p>
      <p>
        We sent a confirmation link to <span className="text-ivory">{email}</span>. It expires in
        24 hours and works once.
      </p>
      {note && <p className="text-accent-2">{note}</p>}
      <button
        type="button"
        onClick={() => void resend()}
        disabled={busy}
        className="w-full rounded-lg border border-accent/40 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent disabled:opacity-40"
      >
        {busy ? "Please wait…" : "Resend"}
      </button>
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="mp-btn-lux w-full rounded-lg bg-ivory py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink"
        >
          Continue
        </button>
      )}
    </div>
  );
}

/** Password accounts: confirm the login email, or ask to change it. */
export function AccountEmailConfirm() {
  const [loaded, setLoaded] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(true);
  const [nextEmail, setNextEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/members/me", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (data: {
          hasPassword?: boolean;
          accountEmail?: string | null;
          emailVerified?: boolean;
        }) => {
          if (cancelled) return;
          setHasPassword(!!data.hasPassword);
          setEmail(data.accountEmail || "");
          setVerified(!!data.emailVerified);
          setLoaded(true);
        }
      )
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || !hasPassword) return null;

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/auth/email/change", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; email?: string };
      if (!data.ok) {
        setNote(data.error || "Could not update email.");
        return;
      }
      setPending(data.email || nextEmail);
      setPassword("");
      setNote("Check that inbox for a confirmation link. Your current sign-in email stays until you confirm.");
    } catch {
      setNote("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mp-person-card mb-5 p-4">
      <p className="text-[12px] font-medium text-accent">Account email</p>
      <p className="mt-1 text-sm text-ivory">{email || "No email on this account"}</p>
      {!verified && email ? (
        <div className="mt-3">
          <EmailCheckPanel email={email} />
        </div>
      ) : (
        <p className="mt-1 text-[13px] text-muted">Confirmed.</p>
      )}
      {pending && (
        <div className="mt-3">
          <EmailCheckPanel email={pending} />
        </div>
      )}
      <form onSubmit={changeEmail} className="mt-4 space-y-2">
        <p className="text-[12px] text-muted">Change the sign-in email. Confirm the new address before it replaces this one.</p>
        <input
          type="email"
          value={nextEmail}
          onChange={(e) => setNextEmail(e.target.value)}
          placeholder="New email"
          required
          className={field}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          required
          minLength={8}
          className={field}
        />
        {note && <p className="text-[13px] text-accent-2">{note}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-accent/40 px-4 py-2 text-[12px] text-accent disabled:opacity-40"
        >
          {busy ? "Please wait…" : "Send confirmation"}
        </button>
      </form>
    </section>
  );
}
