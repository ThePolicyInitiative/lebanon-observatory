import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/compare",
    "/actors",
    "/damage",
    "/map",
    "/finance",
    "/news",
    "/explorer",
    "/ar",
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date("2026-08-06"),
    changeFrequency: route === "/news" ? "hourly" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
