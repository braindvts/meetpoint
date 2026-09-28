"use client";

import Link from "next/link";

/** Minimal legal line. Styling matches the ink / champagne site, without effects. */
export default function LegalFooter({ embedded = false }: { embedded?: boolean }) {
  const year = new Date().getFullYear();
  const inner = (
    <nav aria-label="Legal" className="flex flex-col items-center gap-3 text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px]">
        <Link href="/terms" className="text-muted hover:text-ivory">
          Terms
        </Link>
        <Link href="/privacy" className="text-muted hover:text-ivory">
          Privacy
        </Link>
        <Link href="/contact" className="text-muted hover:text-ivory">
          Contact
        </Link>
      </div>
      <p className="text-[11px] text-muted">© {year} Interlink</p>
    </nav>
  );

  if (embedded) return <div className="mt-1">{inner}</div>;

  return (
    <footer className="border-t border-white/[0.08] px-6 py-8">
      <div className="mx-auto max-w-6xl">{inner}</div>
    </footer>
  );
}
