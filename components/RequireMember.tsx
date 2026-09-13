"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gateRedirect, resolveSessionGate } from "@/lib/hydrateSession";

/** Redirects guests to login and incomplete identities to onboarding. */
export default function RequireMember({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const gate = await resolveSessionGate();
      if (cancelled) return;
      const dest = gateRedirect(gate, pathname || "/discover");
      if (dest) {
        router.replace(dest);
        return;
      }
      setOk(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ok) return null;
  return <>{children}</>;
}
