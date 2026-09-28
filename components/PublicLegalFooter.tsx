"use client";

import { usePathname } from "next/navigation";
import LegalFooter from "@/components/LegalFooter";

const APP_PREFIXES = [
  "/discover",
  "/profile",
  "/chats",
  "/circle",
  "/connections",
  "/plan",
  "/admin",
  "/notifications",
];

function isAppPath(path: string): boolean {
  return APP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/** Legal links on public pages. The home page embeds its own copy in the existing footer. */
export default function PublicLegalFooter() {
  const path = usePathname() || "/";
  if (path === "/" || isAppPath(path)) return null;
  return <LegalFooter />;
}
