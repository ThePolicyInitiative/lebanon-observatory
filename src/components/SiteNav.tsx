"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AR, CHROME } from "@/lib/i18n";

/**
 * One entry per page, in both languages. The Arabic side is a mirror of the
 * same routes under /ar, so following the navigation never drops the reader
 * back into English mid-visit.
 */
const NAV_ITEMS = [
  { path: "/", label: "Home", ar: AR.nav.home },
  { path: "/compare", label: "2024 vs 2026", ar: AR.nav.compare },
  { path: "/actors", label: "Actor layers", ar: AR.nav.actors },
  { path: "/damage", label: "Damage assessments", ar: AR.nav.damage },
  { path: "/map", label: "Map", ar: AR.nav.map },
  { path: "/finance", label: "Finance", ar: AR.nav.finance },
  { path: "/news", label: "Live updates", ar: AR.nav.news },
  { path: "/explorer", label: "Explorer", ar: AR.nav.explorer },
  { path: "/search", label: "Search", ar: "بحث" },
  { path: "/about", label: "About", ar: "عن المرصد" },
];

/** "/compare" becomes "/ar/compare"; "/" becomes "/ar". */
export function localisedHref(path: string, arabic: boolean): string {
  if (!arabic) return path;
  return path === "/" ? "/ar" : `/ar${path}`;
}

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  /** On the Arabic side the same slot returns the reader to English. */
  const isArabic = pathname.startsWith("/ar");
  const chrome = CHROME[isArabic ? "ar" : "en"];
  /**
   * The same page in the other language. Only pages that exist on both sides
   * cross over; anything else falls back to that language's home.
   */
  const basePath = isArabic ? pathname.replace(/^\/ar/, "") || "/" : pathname;
  const known = NAV_ITEMS.some((i) => i.path === basePath);
  const counterpart = isArabic
    ? known
      ? basePath
      : "/"
    : known
      ? localisedHref(basePath, true)
      : "/ar";

  return (
    <header className="on-navy sticky top-0 z-50 min-h-[var(--header-h)] border-b border-[#0e2542] bg-[color:var(--color-navy)]/[0.97] backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link
          href={isArabic ? "/ar" : "/"}
          className="flex min-h-11 items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-white"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded bg-[color:var(--color-amber)] text-sm font-bold text-[color:var(--color-navy)]"
          >
            LR
          </span>
          <span className="leading-tight">
            {/* The wordmark reads in the language of the page under it. It
                was the one English run left standing over an otherwise
                Arabic masthead, directly above the same name in Arabic in
                the hero. */}
            <span className="block text-sm font-semibold text-white">
              {isArabic ? AR.meta.title : "Lebanon Reconstruction Observatory"}
            </span>
            <span className="hidden text-[11px] text-white/60 sm:block">
              2024–2026
            </span>
          </span>
        </Link>
        <nav aria-label={chrome.primaryNav} className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const href = localisedHref(item.path, isArabic);
              const active =
                href === "/" || href === "/ar"
                  ? pathname === href
                  : pathname.startsWith(href);
              return (
                <li key={item.path}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded px-2.5 text-[13px] transition-colors duration-150 ${
                      active
                        ? "font-semibold text-white underline decoration-[color:var(--color-amber)] decoration-2 underline-offset-8"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {isArabic ? item.ar : item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Switching language keeps the reader on the page they are reading,
            rather than sending them back to the other language's home. */}
        <Link
          href={counterpart}
          lang={isArabic ? "en" : "ar"}
          className="ms-auto inline-flex min-h-9 items-center rounded border border-white/35 px-2.5 text-xs font-semibold text-white/85 transition-colors hover:border-white hover:text-white xl:ms-0"
        >
          {isArabic ? "English" : "العربية"}
        </Link>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-white/30 text-white xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? chrome.closeMenu : chrome.openMenu}</span>
          <span aria-hidden className="text-lg leading-none">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label={chrome.primaryNavMobile}
          className="border-t border-white/15 bg-[color:var(--color-navy)] xl:hidden"
        >
          {/* Ten 44px rows plus padding is 522px of sticky element, and the
              hamburger stays active all the way to xl - so a phone in
              landscape, or any window under 1280px, lost the last entries
              permanently: a sticky element with only `top` set never
              scrolls its own overflow back into view. */}
          <ul className="mx-auto max-h-[calc(100dvh-var(--header-h)-1px)] max-w-[1360px] overflow-y-auto overscroll-contain px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => {
              const href = localisedHref(item.path, isArabic);
              const active =
                href === "/" || href === "/ar"
                  ? pathname === href
                  : pathname.startsWith(href);
              return (
                <li key={item.path}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block min-h-11 rounded px-2 py-2.5 text-sm ${
                      active ? "font-semibold text-white" : "text-white/70"
                    }`}
                  >
                    {isArabic ? item.ar : item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
