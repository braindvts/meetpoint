"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="8" cy="9" r="3.2" />
      <circle cx="16.5" cy="10.5" r="2.6" />
      <path d="M3.5 19c.7-3 2.8-4.5 4.5-4.5S11.8 16 12.5 19" strokeLinecap="round" />
      <path d="M13.8 18c.5-2.2 1.8-3.4 2.7-3.4 1.3 0 3.1 1.1 3.7 3.4" strokeLinecap="round" />
    </svg>
  ),
  chats: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M5 6.5h14v8.5H9l-4 3V6.5Z" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" strokeLinecap="round" />
    </svg>
  ),
};

const LINKS = [
  { href: "/discover", label: "Discover", icon: ICONS.search },
  { href: "/circle", label: "Circle", icon: ICONS.circle },
  { href: "/chats", label: "Chats", icon: ICONS.chats },
  { href: "/profile", label: "Profile", icon: ICONS.profile },
];

export default function Nav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const inChatThread = /^\/chats\/[^/]+/.test(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || inChatThread) return null;

  return createPortal(
    <nav
      className="mp-mobile-dock fixed inset-x-0 bottom-0 z-[100] sm:left-1/2 sm:right-auto sm:w-full sm:max-w-[430px] sm:-translate-x-1/2"
      aria-label="App"
    >
      <div className="mp-dock flex pb-[max(0.35rem,env(safe-area-inset-bottom))]">
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
              <span className="leading-none">{l.icon}</span>
              <span className="text-[10px] font-medium tracking-wide">{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body
  );
}
