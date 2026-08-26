import type { Metadata } from "next";
import { Suspense } from "react";
import { AR, localeAlternates } from "@/lib/i18n";
import ArabicPageShell from "../ArabicPageShell";
import NewsExplorer from "@/app/(en)/news/NewsExplorer";
import CoverageHistory from "@/components/CoverageHistory";

export const metadata: Metadata = {
  title: AR.pages.news.title,
  description: AR.pages.news.desc,
  alternates: localeAlternates("/news", "ar"),
};

/**
 * The Arabic live-updates page mounts the same explorer as the English one,
 * in Arabic: tabs, search, filters, the official directory and the coverage
 * analytics all run here over the same endpoint, so both languages read the
 * same articles at the same moment.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  // No opening passage: the English page carries none either.
  return (
    <ArabicPageShell title={AR.pages.news.title} englishHref="/news">
      <section aria-labelledby="ar-news-explorer" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="ar-news-explorer"
            className="text-xl font-semibold text-navy"
          >
            آخر ما نُشر
          </h2>
          <span className="rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[10px] font-bold text-[#8a6200]">
            غير مؤكَّد · خارج كل عدّ
          </span>
        </div>
        <div className="mt-4">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}>
            <NewsExplorer locale="ar" />
          </Suspense>
        </div>
        <p className="mt-6 note-caution text-[12.5px] leading-relaxed text-text-secondary">
          كل خبر يبقى بلغة ناشره ويحيل إليه.
        </p>
      </section>
      <CoverageHistory locale="ar" year={one(params.hy)} kind={one(params.hk)} />
    </ArabicPageShell>
  );
}
