"use client";

import { usePathname } from "next/navigation";

/** Soft enter on app routes. Landing keeps its own hero motion. */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;

  return (
    <div key={pathname} className="mp-page-enter relative z-[2] min-h-dvh">
      {children}
    </div>
  );
}
