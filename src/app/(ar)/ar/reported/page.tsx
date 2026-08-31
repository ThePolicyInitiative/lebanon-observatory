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
  // The quarantine is stated once, in the lede and the point below; the
  // modules keep their own badges, the page-level copy does not repeat it.
  return (
    <ArabicPageShell
      title={AR.pages.reported.title}
      lede={
        <>
          البحث الذي يغذّي التتبّع لا يتوقف، وهذه الصفحة مجراه المباشر:
          تغطية من ناشرين لبنانيين ودوليين وإنسانيين ورسميين، تصل فور
          ظهورها - ما يُنشَر الآن، قبل أن يُقرأ في التحليل.
        </>
      }
      point={
        <>
          كل ما هنا معزول عن التحليل المؤكَّد: لا تدخل أي مادة في أي عدّ أو
          رقم قبل التثبّت منها وقراءتها ضمن المدخلات المتتبَّعة.
        </>
      }
      englishHref="/reported"
    >
      <section aria-labelledby="ar-news-explorer" className="mt-8">
        <h2
          id="ar-news-explorer"
          className="text-h2 font-semibold text-navy"
        >
          آخر ما نُشر
        </h2>
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
