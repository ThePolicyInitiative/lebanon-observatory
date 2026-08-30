import type { Metadata } from "next";
import { Suspense } from "react";
import NewsExplorer from "./NewsExplorer";
import CoverageHistory from "@/components/CoverageHistory";
import ReportedUpdates from "@/components/ReportedUpdates";
import PageShell from "@/components/PageShell";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: localeAlternates("/reported"),
  title: "What is being reported?",
  description:
    "Aggregated live coverage of Lebanon's reconstruction from global, Lebanese, humanitarian and official publishers - searchable and filterable, kept separate from the analysis.",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // The history section filters on URL parameters of its own, prefixed so
  // they cannot collide with the live explorer's filter state.
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  return (
    <PageShell title="Live news and official updates">
      {/* The heading is for the reader who arrives on the anchor and for
          anyone navigating by headings; the explorer prints its own
          controls immediately below it. */}
      <section aria-labelledby="news-explorer" className="mt-6">
        <h2 id="news-explorer" className="sr-only">
          Latest published
        </h2>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}>
          <NewsExplorer />
        </Suspense>
      </section>
      {/*
        * The web updates, which were filed under the actor page because
        * that is where they were first written. They are published
        * material this tracking has not counted, which is what this page
        * is for and what the actor page is not.
        */}
      <div className="mt-7">
        <ReportedUpdates />
      </div>
      <CoverageHistory year={one(params.hy)} kind={one(params.hk)} />
    </PageShell>
  );
}
