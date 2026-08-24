import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const PAGES = ["", "/compare", "/actors", "/damage", "/map", "/finance", "/news", "/explorer"];

/** Bump on content releases; a frozen date that silently ages misleads
 * crawlers more than none at all, so this is the only place it lives. */
const CONTENT_UPDATED = new Date("2026-08-24");

export default function sitemap(): MetadataRoute.Sitemap {
  // Both languages, so the Arabic side is discoverable page by page rather
  // than only through its home - and each entry names its twin, pairing
  // the two halves of the mirrored site for crawlers.
  return PAGES.flatMap((p) => {
    const languages = { en: `${base}${p || "/"}`, ar: `${base}/ar${p}` };
    return (["en", "ar"] as const).map((locale) => ({
      url: locale === "en" ? languages.en : languages.ar,
      lastModified: CONTENT_UPDATED,
      changeFrequency: p === "/news" ? ("hourly" as const) : ("weekly" as const),
      priority: p === "" ? (locale === "en" ? 1 : 0.8) : 0.7,
      alternates: { languages },
    }));
  });
}
