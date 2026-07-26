"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/discover", label: "Discover", icon: "🔍" },
  { href: "/connections", label: "Connections", icon: "🤝" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar (all screens) */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/discover" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm">📍</span>
            <span className="text-lg">
              Meet<span className="text-accent">Point</span>
            </span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(l.href)
                    ? "bg-panel-2 text-white"
                    : "text-slate-400 hover:bg-panel hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Bottom tab bar (phones) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                pathname.startsWith(l.href) ? "text-accent" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
