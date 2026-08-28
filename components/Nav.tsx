"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/Wordmark";

const ICONS: Record<string, React.ReactNode> = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <circle cx="8" cy="9" r="3.2" />
      <circle cx="16.5" cy="10.5" r="2.6" />
      <path d="M3.5 19c.7-3 2.8-4.5 4.5-4.5S11.8 16 12.5 19" strokeLinecap="round" />
      <path d="M13.8 18c.5-2.2 1.8-3.4 2.7-3.4 1.3 0 3.1 1.1 3.7 3.4" strokeLinecap="round" />
    </svg>
  ),
  private: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M5 6.5h14v8.5H9l-4 3V6.5Z" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" strokeLinecap="round" />
    </svg>
  ),
};

const LINKS = [
  { href: "/discover", label: "The Room", tab: "Room", icon: ICONS.search },
  { href: "/connections", label: "Circle", tab: "Circle", icon: ICONS.circle },
  { href: "/chats", label: "Private", tab: "Private", icon: ICONS.private },
  { href: "/profile", label: "Membership", tab: "Seat", icon: ICONS.profile },
];

export default function Nav() {
  const pathname = usePathname();
  const [linkedIn, setLinkedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inChatThread = /^\/chats\/[^/]+/.test(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user: { provider?: string } | null }) => setLinkedIn(!!d.user))
      .catch(() => setLinkedIn(false));
  }, []);

  const dock =
    mounted && !inChatThread
      ? createPortal(
          <nav
            className="mp-mobile-dock fixed inset-x-0 bottom-0 z-[100] px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] sm:hidden"
            aria-label="App"
          >
            <div className="mp-dock mx-auto flex max-w-md">
              {LINKS.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 transition ${
                      active ? "text-accent" : "text-muted active:text-ivory"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute inset-x-4 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
                        aria-hidden
                      />
                    )}
                    <span className={`leading-none transition ${active ? "scale-110" : ""}`}>
                      {l.icon}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide">{l.tab}</span>
                  </Link>
                );
              })}
            </div>
          </nav>,
          document.body
        )
      : null;

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-accent/20 bg-ink/92 backdrop-blur-xl ${
          inChatThread ? "hidden sm:block" : ""
        }`}
      >
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-3 sm:h-[4.25rem] sm:px-6">
          <Wordmark href="/discover" size="sm" />
          <nav className="hidden items-center gap-8 sm:flex">
            {LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-[11px] font-semibold uppercase tracking-[0.26em] transition ${
                    active ? "text-accent" : "text-muted hover:text-ivory"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={async () => {
                const { clearProfile } = await import("@/lib/store");
                clearProfile();
                if (linkedIn) {
                  window.location.href = "/api/auth/logout";
                } else {
                  window.location.href = "/login";
                }
              }}
              className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted transition hover:text-ivory"
            >
              Depart
            </button>
          </nav>
        </div>
      </header>

      {dock}
    </>
  );
}
