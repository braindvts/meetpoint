"use client";

import { usePathname } from "next/navigation";

/** Soft enter on every route change — keeps the app feeling alive. */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="mp-page-enter relative z-[2] min-h-dvh">
      {children}
    </div>
  );
}
