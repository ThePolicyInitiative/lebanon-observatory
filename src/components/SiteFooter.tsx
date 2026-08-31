"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AR, CHROME } from "@/lib/i18n";
import { localisedHref } from "./SiteNav";

/**
 * The footer follows the reader's language for the same reason the header
 * does: a link that quietly returns an Arabic reader to English is a dead
 * end in the middle of the site, not a shortcut.
 *
 * Links only. The identity strip and the dated "last revised" line it
 * once carried were removed at the user's request on 31 August 2026.
 */
/**
 * Topics here, part names in the tab bar. A reader at the foot of a page
 * has already read it and is looking for a subject by name, so the footer
 * says what each page holds.
 */
const LINKS: [string, string, string][] = [
  ["/", "Aim & importance", AR.nav.aim],
  ["/actors", "Actor groups", AR.nav.actors],
  ["/actions", "Action categories", AR.nav.actions],
  ["/map", "The map", AR.nav.map],
  ["/findings", "The five findings", AR.nav.findings],
  ["/reported", "Live updates", AR.nav.news],
  ["/entries", "Data explorer", AR.nav.explorer],
  ["/methodology", "Methodology", AR.nav.method],
  // Search is deliberately absent: the header's search control already
  // reaches it from every page.
];

export default function SiteFooter() {
  const pathname = usePathname();
  const isArabic = pathname.startsWith("/ar");
  const locale = isArabic ? "ar" : "en";

  return (
    <footer className="on-navy mt-16 border-t border-[#0b2a22] bg-navy">
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
      </div>
    </footer>
  );
}
