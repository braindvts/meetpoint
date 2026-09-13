import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import AppChrome from "@/components/AppChrome";
import PlausibleScript from "@/components/PlausibleScript";
import ToastHost from "@/components/ToastHost";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Interlink",
  description:
    "Interlink — private introductions for ambitious people. They end at a dinner table.",
  openGraph: {
    title: "Interlink",
    description:
      "A private network for ambitious people. Identity makes you a Member. Introductions end at a real table.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
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
