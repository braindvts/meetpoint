"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/circle", label: "Circle" },
  { href: "/chats", label: "Chats" },
  { href: "/profile", label: "Profile" },
];

/**
 * Fixed top navigation for the website — always at the top of the viewport,
 * every screen size. (The old bottom dock was easy to miss.)
 */
export default function Nav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const inChatThread = /^\/chats\/[^/]+/.test(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || inChatThread) {
      document.documentElement.classList.remove("mp-has-site-nav");
      return;
    }
    document.documentElement.classList.add("mp-has-site-nav");
    return () => document.documentElement.classList.remove("mp-has-site-nav");
  }, [mounted, inChatThread]);

  if (!mounted || inChatThread) return null;

  return createPortal(
    <nav className="mp-site-nav" aria-label="Conclave">
      <div className="mp-site-nav-inner">
        <Link href="/discover" className="mp-site-nav-brand">
          Conclave
        </Link>
        <div className="mp-site-nav-links" role="list">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                role="listitem"
                aria-current={active ? "page" : undefined}
                className={`mp-site-nav-link ${active ? "is-active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>,
    document.body
  );
}
