import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import AppChrome from "@/components/AppChrome";
import PlausibleScript from "@/components/PlausibleScript";
import ToastHost from "@/components/ToastHost";
import "./globals.css";

/** One clean, readable sans for the whole app. */
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "Conclave",
  description:
    "A private society for introductions that end at a table. Matched by ambition or profession — settled over dinner.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sourceSans.variable}>
      <body className="min-h-screen antialiased [text-rendering:optimizeLegibility]">
        <AppChrome>{children}</AppChrome>
        <ToastHost />
        <AnalyticsBeacon />
        <PlausibleScript />
      </body>
    </html>
  );
}
