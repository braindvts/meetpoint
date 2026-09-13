"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

function RedirectInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!id) return;
    const paid = searchParams.get("paid") === "1" ? "&paid=1" : "";
    router.replace(`/chats?c=${encodeURIComponent(id)}${paid}`);
  }, [id, router, searchParams]);

  return (
    <main className="min-h-dvh px-5 py-10">
      <p className="text-sm text-muted">Opening chat…</p>
    </main>
  );
}

/** Deep links `/chats/[id]` open the split inbox with that thread selected. */
export default function ChatThreadRedirectPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <RedirectInner />
    </Suspense>
  );
}
