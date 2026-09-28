"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function peekStashedConfirmToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem("interlink.emailConfirm") || "";
  } catch {
    return "";
  }
}

function ConfirmEmail() {
  const params = useSearchParams();
  const token = params.get("token") || peekStashedConfirmToken();
  const [state, setState] = useState<"working" | "ok" | "bad">("working");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setState("bad");
      setError("This confirmation link is missing.");
      return;
    }
    try {
      sessionStorage.removeItem("interlink.emailConfirm");
    } catch {
      /* ignore */
    }
    let cancelled = false;
    void fetch("/api/auth/email/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean; error?: string }) => {
        if (cancelled) return;
        if (data.ok) setState("ok");
        else {
          setState("bad");
          setError(data.error || "This confirmation link is invalid.");
        }
        window.history.replaceState(null, "", "/verify-email");
      })
      .catch(() => {
        if (cancelled) return;
        setState("bad");
        setError("Network error. Open the link again.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-accent">INTERLINK</p>
      <h1 className="mt-4 text-2xl font-semibold text-ivory">
        {state === "ok" ? "Email confirmed" : "Confirm your email"}
      </h1>
      {state === "working" && <p className="mt-3 text-sm text-muted">Checking the link…</p>}
      {state === "ok" && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This account email is confirmed. You can continue in Interlink.
        </p>
      )}
      {state === "bad" && <p className="mt-3 text-sm leading-relaxed text-red-300/90">{error}</p>}
      <Link
        href={state === "ok" ? "/discover" : "/login"}
        className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent"
      >
        {state === "ok" ? "Continue" : "Back to sign in"}
      </Link>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="px-6 py-16 text-sm text-muted">Checking the link…</main>}>
      <ConfirmEmail />
    </Suspense>
  );
}
