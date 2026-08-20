"use client";

import { useEffect, useState } from "react";
import NewsCoverageProfile from "@/components/NewsCoverageProfile";
import type { NewsArticle, NewsResponse } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";

/**
 * The live feed on the Arabic side. It calls the same endpoint as the English
 * page, so both languages see the same articles from the same providers at
 * the same moment; only the chrome around them is Arabic. Each item keeps its
 * own language, which is the point of a feed that reads Arabic, English and
 * French publishers side by side.
 */

const SOURCE_TYPE_AR: Record<string, string> = {
  official: "رسمي",
  multilateral: "متعدد الأطراف",
  un: "أممي",
  ngo: "منظمة غير حكومية",
  media: "إعلام",
};

const LANG_AR: Record<string, string> = {
  ar: "عربي",
  en: "إنجليزي",
  fr: "فرنسي",
  other: "أخرى",
};

export default function ArabicNewsFeed() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/news?pageSize=40")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<NewsResponse>;
      })
      .then((j) => live && setData(j))
      .catch((e) => live && setError(e instanceof Error ? e.message : "خطأ"));
    return () => {
      live = false;
    };
  }, []);

  if (error) {
    return (
      <p className="card p-4 text-sm text-[color:var(--color-rust)]">
        تعذّر تحميل المستجدات ({error}).
      </p>
    );
  }
  if (!data) {
    return <div className="h-64 animate-pulse rounded-md bg-white" />;
  }

  const down = data.providers.filter((p) => !p.ok);

  return (
    <section aria-labelledby="ar-news-feed">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ar-news-feed" className="text-xl font-semibold text-[color:var(--color-navy)]">
          آخر ما نُشر
        </h2>
        <span className="rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[10px] font-bold text-[#8a6200]">
          غير مؤكَّد · خارج كل عدّ
        </span>
      </div>

      <p className="mt-2 text-xs text-[color:var(--color-text-secondary)]">
        {data.providers.length - down.length} من {data.providers.length} مزوّداً يعمل ·
        آخر تحديث {fmtDateTime(data.lastUpdated)} · {data.total} مقالاً مطابقاً
        {down.length > 0 ? ` · متعذّرة: ${down.map((p) => p.name).join("، ")}` : ""}
      </p>

      {/* What came in, before the list of what came in. The English page
          draws the same breakdowns with a chart library; these are plain
          bars, which lay out right-to-left without being told how. */}
      <div className="mt-5">
        <NewsCoverageProfile articles={data.articles} locale="ar" />
      </div>

      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {data.articles.map((a: NewsArticle) => (
          <li key={a.id} className="card p-3.5" dir={a.language === "ar" ? "rtl" : "ltr"}>
            <p
              dir="rtl"
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[color:var(--color-text-secondary)]"
            >
              <span className="font-semibold">{a.sourceName}</span>
              <span>·</span>
              <span>{fmtDateTime(a.publishedAt)}</span>
              <span className="rounded-sm border border-[color:var(--color-border)] px-1 py-0.5">
                {LANG_AR[a.language] ?? a.language}
              </span>
              <span className="rounded-sm bg-[#EEF2F7] px-1 py-0.5">
                {SOURCE_TYPE_AR[a.sourceType] ?? a.sourceType}
              </span>
              {a.viaAggregator ? (
                <span className="rounded-sm bg-[#FAF3E3] px-1 py-0.5 font-semibold text-[#8a6200]">
                  عبر Google News
                </span>
              ) : null}
            </p>
            <h3 className="mt-1.5 text-sm font-semibold leading-snug text-[color:var(--color-navy)]">
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
              <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                {a.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-4 note-caution text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
        كل خبر يبقى بلغة ناشره ويحيل إليه. هذه المستجدات غير مؤكَّدة ولا تدخل في أي
        عدّ من أعداد المرصد. الترشيح والبحث الكاملان في الصفحة الإنجليزية.
      </p>
    </section>
  );
}
