"use client";

import SplashScreen from "@/components/SplashScreen";

/** Global chrome: splash on first open. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      {children}
    </>
  );
}
