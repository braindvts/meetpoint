"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { enterAsDemo } from "@/lib/store";

/** Bookmark /demo to skip account creation instantly. */
export default function DemoBypassPage() {
  const router = useRouter();

  useEffect(() => {
    enterAsDemo();
    router.replace("/discover");
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
        Entering as Mohammed…
      </p>
    </main>
  );
}
