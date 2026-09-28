"use client";

import { useEffect, useState } from "react";
import ReauthDialog from "@/components/ReauthDialog";
import { clearProfile } from "@/lib/store";

/**
 * Deletes the server account when one exists. A browser-only demo profile
 * is cleared on this device after the same confirmation phrase.
 */
export default function AccountDeletion() {
  const [confirm, setConfirm] = useState("");
  const [hasServerAccount, setHasServerAccount] = useState(false);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/members/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data: { memberId?: string | null }) => {
        setHasServerAccount(!!data.memberId);
      })
      .catch(() => undefined);
  }, []);

  async function finishLocal() {
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

  return (
    <section id="delete-account" className="mt-8 border border-line px-4 py-4">
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
        <p>You will confirm your password again before deletion. A stale sign-in is not enough.</p>
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
        {error && <p className="text-[13px] text-red-300/90">{error}</p>}
        <button
          type="submit"
          disabled={busy || confirm !== "DELETE"}
          className="border border-red-400/40 px-4 py-2 text-[12px] text-red-300 disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete account"}
        </button>
      </form>
      <ReauthDialog
        open={reauthOpen}
        title="Confirm password to delete"
        onClose={() => setReauthOpen(false)}
        onSuccess={() => {
          void deleteServer();
        }}
      />
    </section>
  );
}
