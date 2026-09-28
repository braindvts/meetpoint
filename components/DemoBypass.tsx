"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestDemoEntry } from "@/lib/demoEntry";

/** Shown only after the server has allowed ENABLE_DEMO_PROFILES. */
export default function DemoBypass() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await requestDemoEntry();
      if (cancelled) return;
      if (!ok) {
        router.replace("/login");
        return;
      }
      const shot = window.location.search.includes("shot=1") ? "?shot=1" : "";
      router.replace(`/discover${shot}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
        Entering as Mohammed…
      </p>
    </main>
  );
}
