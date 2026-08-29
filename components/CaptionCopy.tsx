"use client";

import { useState } from "react";

const POSTS = [
  {
    id: "ig",
    label: "Instagram / TikTok",
    body: `Your next introduction shouldn’t die in a DM.

Conclave is live — early access, in your browser.
Matched by ambition. Settled over dinner.

The app is coming.
The table is already set.

Link in bio.`,
  },
  {
    id: "story",
    label: "Story (short)",
    body: `Early access is open.

Conclave — networking that ends at a dinner table.
Website now. App soon.

Tap the link. Join in your browser.`,
  },
  {
    id: "x",
    label: "X / LinkedIn",
    body: `I built Conclave for people who are actually building something.

Not a feed. A table.
Early access is live on the web — the app is next.

If you’re ambitious, you’re invited.`,
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
