import type { Metadata } from "next";
import { Suspense } from "react";
import NewsExplorer from "./NewsExplorer";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: localeAlternates("/news"),
  title: "Live updates",
  description:
    "Aggregated live coverage of Lebanon's reconstruction from global, Lebanese, humanitarian and official publishers - searchable and filterable, kept separate from the analysis.",
};

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          Live news and official updates
        </h1>
      </header>
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
    </div>
  );
}
