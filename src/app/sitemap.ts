import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const PAGES = ["", "/compare", "/actors", "/damage", "/map", "/finance", "/news", "/explorer"];

export default function sitemap(): MetadataRoute.Sitemap {
  // Both languages, so the Arabic side is discoverable page by page rather
  // than only through its home.
  const routes = [...PAGES, ...PAGES.map((p) => `/ar${p}`)];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date("2026-08-17"),
    changeFrequency: route.endsWith("/news") ? "hourly" : "weekly",
    priority: route === "" ? 1 : route === "/ar" ? 0.8 : 0.7,
  }));
}
