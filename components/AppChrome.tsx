"use client";

import SplashScreen from "@/components/SplashScreen";

/** Global chrome: splash on first open, invitation frame on every screen. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <div className="mp-invite" aria-hidden />
      {children}
    </>
  );
}
