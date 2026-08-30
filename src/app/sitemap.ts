import type { MetadataRoute } from "next";
import { ANALYSIS_REVISED } from "@/lib/about-content";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const PAGES = [
  "",
  "/compare",
  "/who",
  "/destroyed",
  "/map",
  "/money",
  "/reported",
  "/entries",
  "/search",
  "/about",
];

/** The two routes that carry no analysis of their own: a way in and a
 * statement of identity. Both are listed, and both rank below the pages
 * that hold the argument. */
const SECONDARY = new Set(["/about", "/search"]);

/** The date the footer shows readers, not a second copy of it: a crawler
 * date that drifts from the visible one is worse than no date at all. */
const CONTENT_UPDATED = new Date(ANALYSIS_REVISED);

export default function sitemap(): MetadataRoute.Sitemap {
  // Both languages, so the Arabic side is discoverable page by page rather
  // than only through its home - and each entry names its twin, pairing
  // the two halves of the mirrored site for crawlers.
  return PAGES.flatMap((p) => {
    const languages = { en: `${base}${p || "/"}`, ar: `${base}/ar${p}` };
    return (["en", "ar"] as const).map((locale) => ({
      url: locale === "en" ? languages.en : languages.ar,
      lastModified: CONTENT_UPDATED,
      changeFrequency:
        p === "/reported"
          ? ("hourly" as const)
          : SECONDARY.has(p)
            ? ("yearly" as const)
            : ("weekly" as const),
      priority: p === "" ? (locale === "en" ? 1 : 0.8) : SECONDARY.has(p) ? 0.4 : 0.7,
      alternates: { languages },
    }));
  });
}
