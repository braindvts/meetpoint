import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the “N” badge off so product shots and /story exports stay clean.
  devIndicators: false,
  // Previews and simulators load the dev server through a proxy origin; without
  // this, requests for /_next/* assets are treated as cross-origin.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "0.0.0.0",
    "172.30.0.2",
    "*.cursor.sh",
    "*.cursor.com",
    "*.vercel.app",
  ],
};

export default nextConfig;
