"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NewsArticle, NewsResponse } from "@/lib/types";
import type { Locale } from "@/lib/vocab";
import { fmtDateTime } from "@/lib/format";

const T = {
  en: {
    href: "/news",
    unavailable:
      "Live updates are temporarily unavailable. The analysis on this site is unaffected - it is separate, and confirmed.",
    open: "Open the live-updates page",
    retry: "to retry.",
    loading: "Loading latest updates",
    empty: "No recent coverage matched the observatory's filters.",
  },
  ar: {
    href: "/ar/news",
    unavailable:
      "المستجدات المباشرة غير متاحة مؤقتاً. تحليل هذا الموقع لم يتأثّر - فهو منفصل ومؤكَّد.",
    open: "افتح صفحة المستجدات",
    retry: "لإعادة المحاولة.",
    loading: "جارٍ تحميل آخر المستجدات",
    empty: "لا تغطية حديثة طابقت ترشيح المرصد.",
  },
} as const;

/** Compact latest-updates strip for the homepage, with graceful fallback. */
export default function NewsTeaser({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
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
      <p className="card p-3.5 text-sm text-text-secondary">
        {t.unavailable}{" "}
        <Link href={t.href} className="underline underline-offset-2">
          {t.open}
        </Link>{" "}
        {t.retry}
      </p>
    );
  }

  if (!articles) {
    return (
      <div aria-busy="true" aria-label={t.loading} className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-md border border-border bg-white"
          />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="card p-3.5 text-sm text-text-secondary">
        {t.empty}{" "}
        <Link href={t.href} className="underline underline-offset-2">
          {t.open}
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
          className="card p-3.5"
          // Each item keeps its publisher's own direction, the way the
          // full feed does: an English headline inside the Arabic page
          // reads left to right, punctuation included.
          dir={a.language === "ar" ? "rtl" : "ltr"}
        >
          <p className="text-[11px] uppercase tracking-wide text-text-secondary">
            {a.sourceName} · {fmtDateTime(a.publishedAt, locale)}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-navy">
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
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
              {a.description}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
