"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AR, CHROME } from "@/lib/i18n";
import { ABOUT_FOOTER, ANALYSIS_REVISED, CONTACT_EMAIL, CONTENT_CUT_OFF } from "@/lib/about-content";
import { fmtDate } from "@/lib/format";
import { localisedHref } from "./SiteNav";

/**
 * The footer follows the reader's language for the same reason the header
 * does: a link that quietly returns an Arabic reader to English is a dead
 * end in the middle of the site, not a shortcut.
 *
 * Below the page links it carries the two things a returning reader has
 * nowhere else to look for: who is behind the counting and how to reach
 * them, and how current the site is - the cut-off the tracking reaches
 * and the date the analysis last moved. Two dated facts, not a log of
 * edits nobody kept.
 */
const LINKS: [string, string, string][] = [
  ["/compare", "2024 vs 2026", AR.nav.compare],
  ["/actors", "Actor layers", AR.nav.actors],
  ["/damage", "Damage assessments", AR.nav.damage],
  ["/map", "Reconstruction map", AR.nav.map],
  ["/finance", "Finance & delivery", AR.nav.finance],
  ["/news", "Live updates", AR.nav.news],
  ["/explorer", "Data explorer", AR.nav.explorer],
  // The one way into the site that the header does not carry. Its Arabic
  // label is written here rather than in AR.nav because the search route
  // is not one of the navigation's own entries.
  ["/search", "Search", "البحث"],
];

export default function SiteFooter() {
  const pathname = usePathname();
  const isArabic = pathname.startsWith("/ar");
  const locale = isArabic ? "ar" : "en";
  const f = ABOUT_FOOTER[locale];

  return (
    <footer className="mt-16 border-t border-[#0e2542] bg-[color:var(--color-navy)]">
      <div className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6">
        <nav aria-label={CHROME[locale].footerNav}>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            {isArabic ? AR.footer.explore : "Explore"}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {LINKS.map(([path, label, arLabel]) => (
              <li key={path}>
                <Link
                  href={localisedHref(path, isArabic)}
                  className="inline-flex min-h-8 items-center text-white/70 underline-offset-2 hover:text-white hover:underline"
                >
                  {isArabic ? arLabel : label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-2">
          <section aria-labelledby="footer-identity">
            <p
              id="footer-identity"
              className="text-xs font-semibold uppercase tracking-wide text-white/60"
            >
              {f.heading}
            </p>
            <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-white/70">
              {f.identity}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <Link
                href={localisedHref("/about", isArabic)}
                className="inline-flex min-h-8 items-center font-medium text-white underline-offset-2 hover:underline"
              >
                {f.aboutLink}
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                lang="en"
                dir="ltr"
                className="inline-flex min-h-8 items-center text-white/70 underline-offset-2 hover:text-white hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section aria-labelledby="footer-updated" className="md:text-end">
            <p
              id="footer-updated"
              className="text-xs font-semibold uppercase tracking-wide text-white/60"
            >
              {f.updatedLabel}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/80">
              {f.tracking(fmtDate(CONTENT_CUT_OFF, locale))}
              <span aria-hidden className="mx-2 text-white/35">
                ·
              </span>
              <span className="whitespace-nowrap">
                {f.revised(fmtDate(ANALYSIS_REVISED, locale))}
              </span>
            </p>
            <p className="mt-1.5 max-w-prose text-[12px] leading-relaxed text-white/55 md:ms-auto">
              {f.note}
            </p>
          </section>
        </div>
      </div>
    </footer>
  );
}
