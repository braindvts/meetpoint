import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import AppChrome from "@/components/AppChrome";
import PlausibleScript from "@/components/PlausibleScript";
import ToastHost from "@/components/ToastHost";
import { SITE_DESCRIPTION, SITE_ORIGIN, SITE_TITLE } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Interlink",
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Interlink",
    type: "website",
    url: SITE_ORIGIN,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
            __html: `(function(){try{var q=location.search;if(/[?&]shot=1/.test(q)){document.documentElement.setAttribute('data-shot','1');return;}var s=sessionStorage;if(s.getItem('interlink.splash.seen')==='1'||s.getItem('conclave.splash.seen')==='1')return;if(location.pathname.indexOf('/story')===0)return;document.documentElement.classList.add('mp-boot-splash');}catch(e){}})();(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.classList.add('mp-motion');}catch(e){}})();`,
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
