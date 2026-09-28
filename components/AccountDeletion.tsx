"use client";

import { useEffect, useState } from "react";
import { clearProfile } from "@/lib/store";

type SignInMethods = {
  password: boolean;
  google: boolean;
  apple: boolean;
  linkedin: boolean;
};

const EMPTY_SIGN_IN: SignInMethods = {
  password: false,
  google: false,
  apple: false,
  linkedin: false,
};

/**
 * Deletes the server account when one exists. A browser-only demo profile
 * is cleared on this device after the same confirmation phrase.
 * Password accounts confirm with the password form. Linked providers
 * re-login through that provider and return here with the reauth cookie.
 */
export default function AccountDeletion() {
  const [confirm, setConfirm] = useState("");
  const [hasServerAccount, setHasServerAccount] = useState(false);
  const [signIn, setSignIn] = useState<SignInMethods>(EMPTY_SIGN_IN);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const flag = new URLSearchParams(window.location.search).get("reauth");
    if (flag === "mismatch" || flag === "expired" || flag === "unavailable") {
      setError("That sign-in did not match this account. Nothing was deleted.");
    }
    void fetch("/api/members/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { memberId?: string | null; hasPassword?: boolean; signIn?: SignInMethods }) => {
        setHasServerAccount(!!data.memberId);
        setSignIn({
          password: !!(data.signIn?.password ?? data.hasPassword),
          google: !!data.signIn?.google,
          apple: !!data.signIn?.apple,
          linkedin: !!data.signIn?.linkedin,
        });
      })
      .catch(() => undefined);
  }, []);

  async function finishLocal() {
    try {
      localStorage.removeItem("interlink.onboarding.step");
    } catch {
      /* private mode */
    }
    clearProfile();
    window.location.href = "/";
  }

  async function deleteServer() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/members/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        needsReauth?: boolean;
      };
      if (data.needsReauth) {
        setReauthOpen(true);
        return;
      }
      if (!data.ok) {
        setError(data.error || "Could not delete the account.");
        return;
      }
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(
        () => undefined
      );
      await finishLocal();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmPassword(e: React.FormEvent) {
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
      setReauthOpen(false);
      await deleteServer();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  function start(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== "DELETE") {
      setError("Type DELETE in capital letters to confirm.");
      return;
    }
    if (!hasServerAccount) {
      void finishLocal();
      return;
    }
    setReauthOpen(true);
  }

  const providers = [
    signIn.google ? { href: "/api/auth/google?reauth=1", label: "Continue with Google" } : null,
    signIn.apple ? { href: "/api/auth/apple?reauth=1", label: "Continue with Apple" } : null,
    signIn.linkedin ? { href: "/api/auth/linkedin?reauth=1", label: "Continue with LinkedIn" } : null,
  ].filter((item): item is { href: string; label: string } => !!item);

  return (
    <section id="delete" className="mt-8 border border-line px-4 py-4">
      <p className="text-[12px] font-medium text-accent">Delete account</p>
      <div className="mt-2 space-y-2 text-[13px] leading-snug text-muted">
        <p>
          {hasServerAccount
            ? "This removes your Interlink account on the server and the copy stored in this browser."
            : "This browser profile is not a server account. Confirming clears it from this device only."}
        </p>
        <p>What is removed or anonymized:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Name, email, phone, photo, bio, city, and verification details.</li>
          <li>Password and Google, Apple, or LinkedIn sign-in links.</li>
          <li>Introductions and BLACK invitation records tied to you.</li>
          <li>Your chat messages are blanked and you are removed from those chats.</li>
        </ul>
        <p>
          Safety reports and blocks stay, attached to an anonymized id. Payment flags on that
          same id can stay so a charge still has a record. Stripe may keep its own receipt.
          Other members keep their own messages.
        </p>
        <p>
          You will confirm this sign-in again before deletion. A password account enters its
          password. A Google, Apple, or LinkedIn account signs in with that same provider. A stale
          session is not enough.
        </p>
      </div>
      <form onSubmit={start} className="mt-4 space-y-3">
        <label className="block text-[11px] uppercase tracking-[0.16em] text-muted">
          Type DELETE to confirm
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            className="mt-2 w-full border border-line bg-ink px-3 py-2 text-sm normal-case tracking-normal text-ivory outline-none focus:border-accent"
          />
        </label>
        {error && !reauthOpen && <p className="text-[13px] text-red-300/90">{error}</p>}
        <button
          type="submit"
          disabled={busy || confirm !== "DELETE"}
          className="border border-red-400/40 px-4 py-2 text-[12px] text-red-300 disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete account"}
        </button>
      </form>
      {reauthOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-md border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
              Secure step
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ivory">Confirm it’s you</h2>
            <p className="mt-1 text-[13px] text-muted">
              Sign in again to delete this account. This stays valid for 10 minutes.
            </p>
            {signIn.password && (
              <form onSubmit={confirmPassword} className="mt-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  placeholder="Password"
                  className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-3 w-full bg-ivory py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink disabled:opacity-40"
                >
                  {busy ? "Checking…" : "Confirm password"}
                </button>
              </form>
            )}
            {providers.length > 0 && (
              <div className="mt-4 space-y-2">
                {providers.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block border border-line py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
            {!signIn.password && providers.length === 0 && (
              <p className="mt-4 text-[13px] text-muted">
                This account has no password or linked provider to confirm.
              </p>
            )}
            {error && <p className="mt-2 text-[13px] text-red-300/90">{error}</p>}
            <button
              type="button"
              onClick={() => setReauthOpen(false)}
              className="mt-4 w-full border border-line py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
