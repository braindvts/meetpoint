"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isVerifyEmailPath, trackPageview } from "@/lib/analytics";
import { registerNotifyWorker } from "@/lib/notify";

/** Pageviews + register notification service worker. */
export default function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || isVerifyEmailPath(pathname)) return;
    trackPageview();
  }, [pathname]);

  useEffect(() => {
    void registerNotifyWorker();
  }, []);

  return null;
}
