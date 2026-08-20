import type { Metadata } from "next";
import { Suspense } from "react";
import NewsExplorer from "./NewsExplorer";

export const metadata: Metadata = {
  title: "Live updates",
  description:
    "Aggregated live coverage of Lebanon's reconstruction from global, Lebanese, humanitarian and official publishers - searchable and filterable, kept separate from the analysis.",
};

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          Live news and official updates
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Aggregated server-side from Lebanon&apos;s National News Agency in
          Arabic and English, Annahar, Al Jazeera, Arab News, ReliefWeb&apos;s
          Lebanon updates, UN News, Google News in three languages, the GDELT
          project and - when configured - the ReliefWeb API and a licensed
          news API, with caching, deduplication and keyword relevance
          filtering. Most items link straight to the publisher; those that
          arrive through Google News carry an opaque redirect that cannot be
          resolved back to the article, and every one of those is marked.
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
