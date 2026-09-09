"use client";

import { useState } from "react";
import { clearDemoOwnerSession, markDemoOwnerSession } from "@/lib/demoFlag";
import { DEMO_OWNER_EMAIL, isDemoOwnerEmail } from "@/lib/demoOwner";
import { saveProfile } from "@/lib/store";
import type { MyProfile } from "@/lib/types";

export default function EmailAuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    if (data.demoOwner || isDemoOwnerEmail(email)) {
      markDemoOwnerSession();
    } else {
      clearDemoOwnerSession();
    }
    window.location.href = data.next || "/onboarding";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name, mode }),
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

  /** Password never leaves the server — demo-owner mode only. */
  async function signInAsBrian() {
    setError("");
    setBusy(true);
    setMode("signin");
    setEmail(DEMO_OWNER_EMAIL);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: "demo-owner" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        next?: string;
        demoOwner?: boolean;
        profile?: MyProfile | null;
      };
      await finishAuth({ ...data, demoOwner: true });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-line/80 bg-ink/60 px-3 py-2 text-[14px] text-ivory outline-none placeholder:text-muted/55 focus:border-accent";

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div className="flex gap-4 text-[11px] font-semibold uppercase tracking-[0.18em]">
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

      <button
        type="button"
        disabled={busy}
        onClick={() => void signInAsBrian()}
        className="w-full rounded-lg border border-accent/35 bg-accent/[0.07] px-3 py-2 text-left disabled:opacity-40"
      >
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
          Owner
        </span>
        <span className="mt-0.5 block text-[13px] font-medium text-ivory">
          Continue as Brian
        </span>
      </button>

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
      {error && <p className="text-[13px] text-red-300/90">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mp-btn-lux w-full rounded-lg bg-gradient-to-b from-accent-2 to-accent py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-40"
      >
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
