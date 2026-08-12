import type { Metadata } from "next";
import { Suspense } from "react";
import NewsExplorer from "./NewsExplorer";

export const metadata: Metadata = {
  title: "Live updates",
  description:
    "Aggregated live coverage of Lebanon's reconstruction from global, Lebanese, humanitarian and official sources - searchable and filterable, kept separate from the verified analytical dataset.",
};

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          Live news and official updates
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Aggregated server-side from Google News feeds in English, Arabic and
          French, ReliefWeb&apos;s Lebanon updates, UN News, the GDELT project
          and - when configured - the ReliefWeb API and a licensed news API,
          with caching, deduplication and keyword relevance filtering.
          Articles always link to the original publisher.
        </p>
      </header>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}>
          <NewsExplorer />
        </Suspense>
      </div>
    </div>
  );
}
