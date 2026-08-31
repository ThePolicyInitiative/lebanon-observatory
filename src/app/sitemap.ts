import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * The home page is "" rather than "/", so the Arabic twin below comes out
 * as /ar and not /ar/. /compare is gone - the year contrast is a section of the
 * home page - and a sitemap that listed it would hand a crawler two
 * redirects per language.
 */
const PAGES = [
  "",
  "/actors",
  "/actions",
  "/map",
  "/findings",
  "/reported",
  "/entries",
  "/methodology",
  "/search",
];

/** The one route that carries no analysis of its own - a way in. Listed,
 * and ranked below the pages that hold the argument. */
const SECONDARY = new Set(["/search"]);

/**
 * The last content release. Since the footer's dated strip was removed at
 * the user's request (31 Aug 2026), this is the one place the date lives -
 * it exists for crawlers only, and moves with each data release.
 */
const CONTENT_UPDATED = new Date("2026-08-31");

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
