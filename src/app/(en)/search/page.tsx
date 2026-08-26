import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import PageShell from "@/components/PageShell";
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
    <PageShell
      title="Search the observatory"
      lede={
        <>
          One field over the whole site: every page of the analysis and its
          sections, every traced actor in the register, the named localities
          and the regional groupings, the twelve value-chain stages, the four
          actor layers, the indicators and the milestones. Arabic and English
          reach the same target, so a query in either language finds it.
        </>
      }
      /* The Arabic link that used to sit here has gone. It existed because
         the header's language switch is derived from the nav list and this
         route was not on it - which stopped being true when /search and
         /about were added. The switch now resolves /ar/search itself, so
         the paragraph was pointing at the same place twice. */
      point={
        <>
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
        </>
      }
    >

      <div className="mt-6">
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}
        >
          <SiteSearch />
        </Suspense>
      </div>
    </PageShell>
  );
}
