import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalDocument({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 pb-20 pt-14 text-ivory">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">{kicker}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-5 border border-accent/30 bg-accent/[0.06] px-4 py-3 text-[13px] leading-relaxed text-accent-2">
        Draft for professional legal review. This page is not legal advice, does not create a
        lawyer-client relationship, and must not be treated as a finished policy. Bracketed
        placeholders are unknown facts. Do not launch on this text until counsel replaces them
        and approves the draft.
      </p>
      <article className="mt-8 space-y-8 text-[14px] leading-relaxed text-ivory/90 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ivory [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline">
        {children}
      </article>
      <p className="mt-10 text-[13px] text-muted">
        <Link href="/">Interlink</Link>
        {" · "}
        <Link href="/terms">Terms</Link>
        {" · "}
        <Link href="/privacy">Privacy</Link>
        {" · "}
        <Link href="/contact">Contact</Link>
      </p>
    </main>
  );
}
