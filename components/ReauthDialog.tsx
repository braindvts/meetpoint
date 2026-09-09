"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

/** Password step-up for sensitive actions (billing / BLACK). */
export default function ReauthDialog({
  open,
  onClose,
  onSuccess,
  title = "Confirm it’s you",
}: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || "Could not confirm");
        return;
      }
      setPassword("");
      onSuccess();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-[#12110f] p-5 shadow-2xl"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
          Secure step
        </p>
        <h2 className="mt-2 text-xl font-semibold text-ivory">{title}</h2>
        <p className="mt-1 text-[13px] text-muted">
          Enter your password to continue. This stays valid for 10 minutes.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="Password"
          className="mt-4 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent"
        />
        {error && <p className="mt-2 text-[13px] text-red-300/90">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-line py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-gradient-to-b from-accent-2 to-accent py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink disabled:opacity-40"
          >
            {busy ? "Checking…" : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
