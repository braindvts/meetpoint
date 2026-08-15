"use client";

import { useState } from "react";
import { redeemEliteCode } from "@/lib/apiClient";
import { loadProfile, saveProfile } from "@/lib/store";
import { track } from "@/lib/analytics";

export default function EliteInviteCard({ elite }: { elite?: boolean }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (elite) {
    return (
      <section className="mb-5 border border-accent/35 bg-accent/[0.07] p-4 sm:mb-8 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
          Elite
        </p>
        <p className="mt-1 text-sm text-ivory">Your Centurion seat is active.</p>
      </section>
    );
  }

  async function redeem() {
    setBusy(true);
    setMsg("");
    const result = await redeemEliteCode(code.trim());
    if (!result.ok) {
      setMsg(result.error || "Invalid code");
      setBusy(false);
      return;
    }
    const p = loadProfile();
    if (p) {
      saveProfile({ ...p, elite: true });
    }
    track("elite_redeemed");
    setMsg("Welcome to Elite.");
    setCode("");
    setBusy(false);
  }

  return (
    <section className="mb-5 border border-line/70 bg-panel/60 p-4 sm:mb-8 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
        Elite invite
      </p>
      <p className="mt-1 text-sm text-muted">
        Have an invite code? Redeem it for Centurion access.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Invite code"
          className="min-w-0 flex-1 border border-line bg-ink px-3 py-2.5 text-sm text-ivory outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={busy || !code.trim()}
          onClick={redeem}
          className="shrink-0 bg-gradient-to-b from-accent-2 to-accent px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink disabled:opacity-40"
        >
          Redeem
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-accent-2">{msg}</p>}
    </section>
  );
}
