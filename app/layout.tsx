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
  title: "Conclave",
  description:
    "Conclave — the private network for ambitious people. Use it in the browser now; native app later.",
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
            __html: `(function(){try{var q=location.search;if(/[?&]shot=1/.test(q)){document.documentElement.setAttribute('data-shot','1');return;}if(sessionStorage.getItem('conclave.splash.seen')==='1')return;if(location.pathname.indexOf('/story')===0)return;document.documentElement.classList.add('mp-boot-splash');}catch(e){}})();`,
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
