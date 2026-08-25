import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SiteSearch from "@/components/SiteSearch";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: localeAlternates("/search"),
  title: "Search",
  description:
    "One way into the Lebanon Reconstruction Observatory: find a page, a traced actor, a town, a value-chain stage, an actor layer, an indicator or a milestone, in Arabic or English.",
};

/**
 * The site-wide search. Every other page searches itself - the explorer
 * searches the traced entries, the news page searches the coverage - so a
 * reader who knew a town or an actor had no single way in. This is it.
 */
export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          Search the observatory
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          One field over the whole site: every page of the analysis and its
          sections, every traced actor in the register, the named localities
          and the regional groupings, the twelve value-chain stages, the four
          actor layers, the indicators and the milestones. Arabic and English
          reach the same target, so a query in either language finds it.
        </p>
        {/* The header's language switch crosses over only on the routes it
            lists, and this one is not among them, so the Arabic twin of
            this page is linked here rather than left unreachable. */}
        <p className="mt-3 text-sm">
          <Link
            href="/ar/search"
            hrefLang="ar"
            lang="ar"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            ابحث بالعربية
          </Link>
        </p>
        <p className="note-caution mt-4 max-w-3xl text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
          This searches the observatory&apos;s own surfaces. It does not reach
          the live news feed, and it does not read the full text of every
          traced entry - each of those carries its own search on its own page:{" "}
          <Link
            href="/explorer"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            the explorer
          </Link>{" "}
          and{" "}
          <Link
            href="/news"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            the news page
          </Link>
          .
        </p>
      </header>

      <div className="mt-6">
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}
        >
          <SiteSearch />
        </Suspense>
      </div>
    </div>
  );
}
