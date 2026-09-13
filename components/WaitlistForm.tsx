"use client";

import { useEffect, useMemo, useState } from "react";
import { INTERLINK_WAITLIST_FORM_URL } from "@/lib/waitlistPublic";

type SubmitResponse = {
  ok?: boolean;
  already?: boolean;
  configured?: boolean;
  fallback?: boolean;
  formUrl?: string;
  error?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidClientEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

const fieldClass =
  "w-full rounded-xl border border-accent/25 bg-[#12110f] px-3 py-3 text-sm text-ivory outline-none placeholder:text-muted/70 focus:border-accent";

export default function WaitlistForm({
  compact = false,
  id = "waitlist",
}: {
  compact?: boolean;
  id?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"new" | "already" | null>(null);
  const [formUrl, setFormUrl] = useState(INTERLINK_WAITLIST_FORM_URL);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  const fallbackUrl = useMemo(
    () => formUrl || INTERLINK_WAITLIST_FORM_URL,
    [formUrl],
  );

  useEffect(() => {
    if (typeof window !== "undefined" && /[?&]form=1/.test(window.location.search)) {
      setShowEmbed(true);
    }
    let cancelled = false;
    void fetch("/api/waitlist")
      .then((r) => r.json())
      .then((data: { configured?: boolean; formUrl?: string }) => {
        if (cancelled) return;
        setApiReady(Boolean(data.configured));
        if (data.formUrl) setFormUrl(data.formUrl);
      })
      .catch(() => {
        if (!cancelled) setApiReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const nextEmail = email.trim();
    if (!isValidClientEmail(nextEmail)) {
      setError("Enter a valid email.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nextEmail,
          name: name.trim(),
          company,
        }),
      });
      const data = (await res.json()) as SubmitResponse;
      if (data.formUrl) setFormUrl(data.formUrl);

      if (data.ok) {
        setDone(data.already ? "already" : "new");
        return;
      }

      if (data.fallback || data.configured === false) {
        setFormUrl(data.formUrl || INTERLINK_WAITLIST_FORM_URL);
        setError("");
        if (compact) {
          window.location.href = "/waitlist?form=1";
          return;
        }
        setShowEmbed(true);
        return;
      }

      if (data.formUrl) setShowEmbed(true);
      setError(data.error || "Could not join the waitlist. Try again.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div
        className={
          compact
            ? "mx-auto max-w-md rounded-xl border border-accent/20 bg-panel/70 px-5 py-6 text-center"
            : "rounded-xl border border-accent/20 bg-panel/70 px-6 py-8 text-center"
        }
        role="status"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
          You’re on the list
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ivory/80">
          {done === "already"
            ? "This email is already reserved. We’ll write when a seat opens."
            : "We’ll write when a seat opens."}
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "mx-auto w-full max-w-md" : "w-full"}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <label className="sr-only" htmlFor={`${id}-email`}>
          Email
        </label>
        {!compact && (
          <input
            id={`${id}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            autoComplete="name"
            maxLength={120}
            className={fieldClass}
          />
        )}
        <input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          required
          className={fieldClass}
        />
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        {error && <p className="text-sm text-red-300/90">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-accent-2 to-accent px-8 py-3.5 text-[12px] font-semibold tracking-wide text-ink disabled:opacity-40"
        >
          {busy ? "Sending…" : compact ? "Join the waitlist" : "Request access"}
        </button>
      </form>

      {apiReady === false && !showEmbed && !compact && (
        <p className="mt-4 text-center text-[12px] leading-relaxed text-muted">
          Same list as the public form —{" "}
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-ivory"
          >
            open it here
          </a>
          .
        </p>
      )}
      {showEmbed && !compact && (
        <div className="mt-6 space-y-3">
          <p className="text-center text-[13px] leading-relaxed text-muted">
            Finish on the live waitlist form — same list as everyone already on it.
          </p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl border border-accent/30 px-8 py-3.5 text-[12px] font-medium tracking-wide text-accent transition hover:bg-accent/5"
          >
            Open waitlist form
          </a>
          <iframe
            title="Interlink waitlist"
            src={fallbackUrl}
            className="h-[28rem] w-full rounded-xl border border-line/70 bg-panel"
          />
        </div>
      )}
      {apiReady === false && compact && (
        <p className="mt-3 text-center text-[12px] leading-relaxed text-muted">
          Or{" "}
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-ivory"
          >
            open the live form
          </a>
          .
        </p>
      )}
    </div>
  );
}
