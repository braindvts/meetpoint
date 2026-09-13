import type { Metadata, Viewport } from "next";
import { Outfit, Syne } from "next/font/google";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import AppChrome from "@/components/AppChrome";
import PlausibleScript from "@/components/PlausibleScript";
import ToastHost from "@/components/ToastHost";
import { BRAND, BRAND_LINE } from "@/lib/brand";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: BRAND,
  description: `${BRAND} — ${BRAND_LINE} Use it in the browser now; native app later.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07080c",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(/[?&]shot=1/.test(location.search))document.documentElement.setAttribute('data-shot','1')`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased [text-rendering:optimizeLegibility]">
        <AppChrome>{children}</AppChrome>
        <ToastHost />
        <AnalyticsBeacon />
        <PlausibleScript />
      </body>
    </html>
  );
}
