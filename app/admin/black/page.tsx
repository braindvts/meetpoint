"use client";

import { useState } from "react";
import Link from "next/link";

/** Operator BLACK grant — by member id, using ADMIN_SECRET. */
export default function BlackAdminPage() {
  const [secret, setSecret] = useState("");
  const [memberId, setMemberId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function grant(black: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/black/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, memberId, black }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        name?: string;
        black?: boolean;
      };
      if (!data.ok) {
        setMessage(data.error || "Failed");
        return;
      }
      setMessage(
        `${data.name || memberId} is now ${data.black ? "BLACK" : "not BLACK"}.`
      );
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12 text-ivory">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">
        Admin
      </p>
      <h1 className="mt-2 text-3xl font-semibold">BLACK grant</h1>
      <p className="mt-2 text-sm text-muted">
        Uses <code className="text-accent">ADMIN_SECRET</code>. Member IDs come from the
        database after someone saves a profile.
      </p>

      <label className="mt-8 block text-[11px] uppercase tracking-[0.2em] text-muted">
        Admin secret
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="mt-2 w-full border border-line bg-panel px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent"
        />
      </label>

      <label className="mt-4 block text-[11px] uppercase tracking-[0.2em] text-muted">
        Member id
        <input
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="mt-2 w-full border border-line bg-panel px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent"
          placeholder="cuid…"
        />
      </label>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          disabled={busy || !secret || !memberId}
          onClick={() => grant(true)}
          className="flex-1 bg-gradient-to-b from-accent-2 to-accent py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-40"
        >
          Grant BLACK
        </button>
        <button
          type="button"
          disabled={busy || !secret || !memberId}
          onClick={() => grant(false)}
          className="flex-1 border border-line py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted disabled:opacity-40"
        >
          Revoke
        </button>
      </div>

      {message && <p className="mt-4 text-sm text-accent-2">{message}</p>}

      <Link href="/profile" className="mt-10 inline-block text-sm text-muted underline">
        Back to profile
      </Link>
    </main>
  );
}
