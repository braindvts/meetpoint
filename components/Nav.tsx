"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { loadChats } from "@/lib/store";
import { totalUnread } from "@/lib/chatUnread";

const LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/events", label: "Events" },
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
  const [chatUnread, setChatUnread] = useState(0);
  const inChatThread = /^\/chats\/[^/]+/.test(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const refresh = () => setChatUnread(totalUnread(loadChats()));
    refresh();
    window.addEventListener("meetpoint:chats-changed", refresh);
    window.addEventListener("meetpoint:unread-changed", refresh);
    return () => {
      window.removeEventListener("meetpoint:chats-changed", refresh);
      window.removeEventListener("meetpoint:unread-changed", refresh);
    };
  }, [mounted]);

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
    <nav className="mp-site-nav" aria-label="Interlink">
      <div className="mp-site-nav-inner">
        <Link href="/discover" className="mp-site-nav-brand">
          Interlink
        </Link>
        <div className="mp-site-nav-links" role="list">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            const showBadge = l.href === "/chats" && chatUnread > 0;
            return (
              <Link
                key={l.href}
                href={l.href}
                role="listitem"
                aria-current={active ? "page" : undefined}
                className={`mp-site-nav-link relative ${active ? "is-active" : ""}`}
              >
                {l.label}
                {showBadge ? (
                  <span className="absolute -right-1 -top-1 grid min-h-[1rem] min-w-[1rem] place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>,
    document.body
  );
}
