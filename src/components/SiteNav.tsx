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
/**
 * The tab bar is the question the reader arrived with.
 *
 * It used to be eight topics - Home, 2024 vs 2026, Actor layers, Damage
 * assessments, Map, Finance, Live updates, Explorer - which named the
 * site's own filing rather than anything a reader wants to know, and put
 * an axis (the year) and a tool (the explorer) beside four subjects as
 * though they were the same kind of thing.
 *
 * Each of these is a question the tracking can answer, and each page is
 * one instrument tuned to answer exactly one of them. The map is not a
 * tab, because "map" is not a question: it is how /who draws its answer.
 */
const NAV_ITEMS = [
  { path: "/", label: "Was anything built?", short: "Built?", ar: AR.nav.built, arShort: AR.nav.builtShort },
  { path: "/who", label: "Who is doing what?", short: "Who?", ar: AR.nav.who, arShort: AR.nav.whoShort },
  { path: "/money", label: "Where did the money go?", short: "Money?", ar: AR.nav.money, arShort: AR.nav.moneyShort },
  { path: "/destroyed", label: "What was destroyed?", short: "Destroyed?", ar: AR.nav.destroyed, arShort: AR.nav.destroyedShort },
  { path: "/reported", label: "What is being reported?", short: "Reported?", ar: AR.nav.reported, arShort: AR.nav.reportedShort },
  { path: "/methodology", label: "How was this built?", short: "How?", ar: AR.nav.methodology, arShort: AR.nav.methodologyShort },
];

/**
 * Every route that exists in both languages - which is not the same list as
 * the tabs above, and the difference matters.
 *
 * The language toggle sends a reader to the same page in the other
 * language, and falls back to that language's home when there is no
 * counterpart. It used to decide that from NAV_ITEMS, so a route's presence
 * in the tab bar silently determined whether its reader could cross
 * languages: /search and /about existed on both sides but were not tabs, so
 * the toggle dropped anyone reading them back to the home page, and the
 * search page grew a hand-written Arabic link to work around it.
 *
 * Two lists, because they answer two questions. What belongs in the tab bar
 * is an editorial decision about the argument's shape; what exists in both
 * languages is a fact about the routes. /search and /about are reachable
 * from the footer, which carries both.
 */
const BILINGUAL_ROUTES = [...NAV_ITEMS.map((i) => i.path), "/search", "/about"];

/** "/who" becomes "/ar/who"; "/" becomes "/ar". */
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
  const known = BILINGUAL_ROUTES.includes(basePath);
  const counterpart = isArabic
    ? known
      ? basePath
      : "/"
    : known
      ? localisedHref(basePath, true)
      : "/ar";

  return (
    <header className="on-navy sticky top-0 z-50 min-h-[var(--header-h)] border-b border-[#0e2542] bg-navy/[0.97] backdrop-blur-sm">
      {/* py-1.5, not py-2.5: the header is 44px of pointer target plus its
          padding plus a border, so the only way to tighten it without
          shrinking the target is to take the 8px off the padding. That is
          what --header-h moving 65 -> 57 is, and every sticky offset on the
          site follows it because they all read the token. */}
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-1.5 sm:px-6">
        <Link
          href={isArabic ? "/ar" : "/"}
          className="flex min-h-11 items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-white"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded bg-amber text-body font-bold text-navy"
          >
            LR
          </span>
          <span className="leading-tight">
            {/* The wordmark reads in the language of the page under it. It
                was the one English run left standing over an otherwise
                Arabic masthead, directly above the same name in Arabic in
                the hero. */}
            <span className="block text-body font-semibold text-white">
              {isArabic ? AR.meta.title : "Lebanon Reconstruction Observatory"}
            </span>
            <span className="hidden text-micro text-white/60 sm:block">
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
                    className={`inline-flex min-h-11 items-center rounded px-2.5 text-meta transition-colors duration-150 ${
                      active
                        ? "font-semibold text-white underline decoration-amber decoration-2 underline-offset-8"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {/*
                     * The whole question where the bar has room, and the
                     * one-word form where it does not. Six questions run
                     * about 800px at this size, so they fit a desktop and
                     * crowd a small laptop - and a truncated question
                     * reads worse than a short one, so the short form is
                     * written rather than clipped.
                     */}
                    <span className="hidden xl:inline">
                      {isArabic ? item.ar : item.label}
                    </span>
                    <span className="xl:hidden">
                      {isArabic ? item.arShort : item.short}
                    </span>
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
          className="ms-auto inline-flex min-h-9 items-center rounded border border-white/35 px-2.5 text-meta font-semibold text-white/85 transition-colors hover:border-white hover:text-white xl:ms-0"
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
          <span aria-hidden className="text-h3 leading-none">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label={chrome.primaryNavMobile}
          className="border-t border-white/15 bg-navy xl:hidden"
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
                    className={`block min-h-11 rounded px-2 py-2.5 text-body ${
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
