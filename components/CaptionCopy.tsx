"use client";

import { useState } from "react";

const POSTS = [
  {
    id: "ig",
    label: "Instagram / TikTok",
    body: `Conclave is live — in your browser.

A private network for ambitious people.
Matched by ambition. Then you take it to dinner.

Website now. Native app soon.
Beta is open. Link in bio.`,
  },
  {
    id: "story",
    label: "Story (short)",
    body: `The website is live.

CONCLAVE — networking that ends at a dinner table.
Open it in your browser. The app is next.

Tap the link.`,
  },
  {
    id: "x",
    label: "X / LinkedIn",
    body: `I shipped Conclave.

It’s a private network you open in the browser — introductions matched by ambition, settled over dinner. Native app is next.

Early access is live.`,
  },
];

export default function CaptionCopy() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-4">
      {POSTS.map((p) => (
        <div key={p.id} className="rounded-2xl border border-white/10 bg-[#12110f] p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">{p.label}</p>
            <button
              type="button"
              onClick={() => copy(p.id, p.body)}
              className="text-[11px] font-semibold text-ivory/80"
            >
              {copied === p.id ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ivory/80">
            {p.body}
          </pre>
        </div>
      ))}
    </div>
  );
}
