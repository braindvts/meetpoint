"use client";

import PageTransition from "@/components/PageTransition";
import SplashScreen from "@/components/SplashScreen";

/** Global chrome: splash on first open, soft route enter. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
