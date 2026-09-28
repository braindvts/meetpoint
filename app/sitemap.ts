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
    {
      url: `${SITE_ORIGIN}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_ORIGIN}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_ORIGIN}/contact`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
