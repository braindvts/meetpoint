"use client";

import NotificationSync from "@/components/NotificationSync";
import SplashScreen from "@/components/SplashScreen";

/** Global chrome: splash on first open, notification feed kept current. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <NotificationSync />
      {children}
    </>
  );
}
