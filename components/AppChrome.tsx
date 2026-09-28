"use client";

import MotionField from "@/components/MotionField";
import NotificationSync from "@/components/NotificationSync";
import SplashScreen from "@/components/SplashScreen";

/** Global chrome: splash on first open, scroll motion, notification feed. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <MotionField />
      <NotificationSync />
      {children}
    </>
  );
}
