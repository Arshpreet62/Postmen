import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/about", siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: new URL("/login", siteUrl).toString(),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: new URL("/signup", siteUrl).toString(),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
