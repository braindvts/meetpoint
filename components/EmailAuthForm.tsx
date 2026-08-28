"use client";

import { useState } from "react";

export default function EmailAuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, mode }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; next?: string };
      if (!data.ok) {
        setError(data.error || "Could not sign in.");
        return;
      }
      window.location.href = data.next || "/onboarding";
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-none border border-accent/25 bg-ink px-3 py-3 text-sm text-ivory outline-none placeholder:text-muted/70 focus:border-accent";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={mode === "signin" ? "text-accent" : "text-muted"}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
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
        placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        required
        minLength={8}
        className={field}
      />
      {error && <p className="text-sm text-red-300/90">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mp-btn-lux w-full bg-gradient-to-b from-accent-2 to-accent py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink disabled:opacity-40"
      >
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in with email"}
      </button>
      <p className="text-[11px] leading-relaxed text-muted/70">
        Your session stays signed in on this device until you depart.
      </p>
    </form>
  );
}
