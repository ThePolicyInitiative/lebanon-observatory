"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AR } from "@/lib/i18n";
import { localisedHref } from "./SiteNav";

/**
 * The footer follows the reader's language for the same reason the header
 * does: a link that quietly returns an Arabic reader to English is a dead
 * end in the middle of the site, not a shortcut.
 */
const LINKS: [string, string, string][] = [
  ["/compare", "2024 vs 2026", AR.nav.compare],
  ["/actors", "Actor layers", AR.nav.actors],
  ["/damage", "Damage assessments", AR.nav.damage],
  ["/map", "Reconstruction map", AR.nav.map],
  ["/finance", "Finance & delivery", AR.nav.finance],
  ["/news", "Live updates", AR.nav.news],
  ["/explorer", "Data explorer", AR.nav.explorer],
];

export default function SiteFooter() {
  const pathname = usePathname();
  const isArabic = pathname.startsWith("/ar");

  return (
    <footer className="mt-16 border-t border-[#0e2542] bg-[color:var(--color-navy)]">
      <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
        <nav aria-label="Footer">
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
      </div>
    </footer>
  );
}
