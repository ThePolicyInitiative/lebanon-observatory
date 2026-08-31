"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AR, CHROME } from "@/lib/i18n";
import { ABOUT_FOOTER, ANALYSIS_REVISED, CONTACT_EMAIL, CONTENT_THROUGH } from "@/lib/about-content";
import { fmtDate } from "@/lib/format";
import { localisedHref } from "./SiteNav";

/**
 * The footer follows the reader's language for the same reason the header
 * does: a link that quietly returns an Arabic reader to English is a dead
 * end in the middle of the site, not a shortcut.
 *
 * Below the page links it carries the two things a returning reader has
 * nowhere else to look for: who is behind the counting and how to reach
 * them, and how current the site is - the date the tracking reaches
 * and the date the analysis last moved. Two dated facts, not a log of
 * edits nobody kept.
 */
/**
 * Topics here, questions in the tab bar - deliberately, and not a leftover.
 * A reader at the foot of a page has already read it and is looking for a
 * subject by name, so the footer says what each page holds; a reader at the
 * top has not, and arrives with a question.
 *
 * The list had seven entries when there were seven pages. "2024 vs 2026"
 * and "Reconstruction map" pointed at routes that no longer exist - the
 * year is a control on the home page and the map is a section of /who -
 * and repointing them would have printed two links to /who and two to the
 * home page in one seven-item list.
 */
const LINKS: [string, string, string][] = [
  ["/", "The two responses compared", AR.nav.compare],
  ["/who", "Actor groups & map", AR.nav.actors],
  ["/destroyed", "Damage assessments", AR.nav.damage],
  ["/money", "Finance & delivery", AR.nav.finance],
  ["/reported", "Live updates", AR.nav.news],
  ["/entries", "Data explorer", AR.nav.explorer],
  ["/methodology", "Methodology", AR.nav.method],
  // Search is not a tab, so this is how a reader reaches it. Its Arabic
  // label is written here rather than in AR.nav because the search route is
  // not one of the navigation's own entries.
  //
  // About is not listed here: it already has its own link below, beside the
  // contact line, and adding it here put two links to the same page in one
  // footer.
  ["/search", "Search", "البحث"],
];

export default function SiteFooter() {
  const pathname = usePathname();
  const isArabic = pathname.startsWith("/ar");
  const locale = isArabic ? "ar" : "en";
  const f = ABOUT_FOOTER[locale];

  return (
    <footer className="on-navy mt-16 border-t border-[#0e2542] bg-navy">
      <div className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6">
        <nav aria-label={CHROME[locale].footerNav}>
          <p className="text-micro font-semibold uppercase tracking-wide text-white/60">
            {isArabic ? AR.footer.explore : "Explore"}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-body">
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
              className="text-micro font-semibold uppercase tracking-wide text-white/60"
            >
              {f.heading}
            </p>
            <p className="mt-2 max-w-prose text-meta leading-relaxed text-white/70">
              {f.identity}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body">
              <Link
                href={localisedHref("/about", isArabic)}
                className="inline-flex min-h-8 items-center font-medium text-white underline-offset-2 hover:underline"
              >
                {f.aboutLink}
              </Link>
              {/* No address until a real one exists: a live mailto that
                  reaches nobody is worse than none. */}
              {CONTACT_EMAIL ? (
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  lang="en"
                  dir="ltr"
                  className="inline-flex min-h-8 items-center text-white/70 underline-offset-2 hover:text-white hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              ) : null}
            </p>
          </section>

          <section aria-labelledby="footer-updated" className="md:text-end">
            <p
              id="footer-updated"
              className="text-micro font-semibold uppercase tracking-wide text-white/60"
            >
              {f.updatedLabel}
            </p>
            <p className="mt-2 text-meta leading-relaxed text-white/80">
              {f.tracking(fmtDate(CONTENT_THROUGH, locale))}
              <span aria-hidden className="mx-2 text-white/35">
                ·
              </span>
              <span className="whitespace-nowrap">
                {f.revised(fmtDate(ANALYSIS_REVISED, locale))}
              </span>
            </p>
            <p className="mt-1.5 max-w-prose text-meta leading-relaxed text-white/55 md:ms-auto">
              {f.note}
            </p>
          </section>
        </div>
      </div>
    </footer>
  );
}
