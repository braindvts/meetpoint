import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_ORIGIN}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_ORIGIN}/events`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_ORIGIN}/login`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
