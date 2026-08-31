import type { Metadata } from "next";
import { Suspense } from "react";
import { AR, localeAlternates } from "@/lib/i18n";
import ArabicPageShell from "../ArabicPageShell";
import ReportedUpdates from "@/components/ReportedUpdates";
import NewsExplorer from "@/app/(en)/reported/NewsExplorer";
import CoverageHistory from "@/components/CoverageHistory";

export const metadata: Metadata = {
  title: AR.pages.reported.title,
  description: AR.pages.reported.desc,
  alternates: localeAlternates("/reported", "ar"),
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
    <ArabicPageShell title={AR.pages.reported.title} englishHref="/reported">
      <section aria-labelledby="ar-news-explorer" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="ar-news-explorer"
            className="text-h2 font-semibold text-navy"
          >
            آخر ما نُشر
          </h2>
          <span className="rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-micro font-bold text-[#8a6200]">
            غير مؤكَّد · خارج كل عدّ
          </span>
        </div>
        <div className="mt-4">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}>
            <NewsExplorer locale="ar" />
          </Suspense>
        </div>
        <p className="mt-6 note-caution text-meta leading-relaxed text-text-secondary">
          كل خبر يبقى بلغة ناشره ويحيل إليه.
        </p>
      </section>
      {/* المستجدات المنشورة، وكانت مُدرجة تحت صفحة الجهات. */}
      <div className="mt-7">
        <ReportedUpdates locale="ar" />
      </div>
      <CoverageHistory locale="ar" year={one(params.hy)} kind={one(params.hk)} />
    </ArabicPageShell>
  );
}
