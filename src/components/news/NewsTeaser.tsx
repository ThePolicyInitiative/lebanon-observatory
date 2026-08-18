"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NewsArticle, NewsResponse } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";

/** Compact latest-updates strip for the homepage, with graceful fallback. */
export default function NewsTeaser() {
  const [articles, setArticles] = useState<NewsArticle[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news?pageSize=4&onlyRelevant=1")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<NewsResponse>;
      })
      .then((data) => {
        if (!cancelled) setArticles(data.articles.slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="card p-4 text-sm text-[color:var(--color-text-secondary)]">
        Live updates are temporarily unavailable. The analytical data on
        this site is unaffected - it is a separate, confirmed analysis.{" "}
        <Link href="/news" className="underline underline-offset-2">
          Open the live-updates page
        </Link>{" "}
        to retry.
      </p>
    );
  }

  if (!articles) {
    return (
      <div aria-busy="true" aria-label="Loading latest updates" className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-md border border-[color:var(--color-border)] bg-white"
          />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="card p-4 text-sm text-[color:var(--color-text-secondary)]">
        No recent relevant coverage found in the aggregated sources.{" "}
        <Link href="/news" className="underline underline-offset-2">
          Open the live-updates page
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {articles.map((a) => (
        <article
          key={a.id}
          className="card p-4"
        >
          <p className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-secondary)]">
            {a.sourceName} · {fmtDateTime(a.publishedAt)}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-[color:var(--color-navy)]">
            <a
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {a.title}
            </a>
          </h3>
          {a.description ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
              {a.description}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
