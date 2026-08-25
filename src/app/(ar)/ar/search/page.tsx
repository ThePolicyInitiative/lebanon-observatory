import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { localeAlternates } from "@/lib/i18n";
import ArabicPageShell from "../ArabicPageShell";
import SiteSearch from "@/components/SiteSearch";

export const metadata: Metadata = {
  title: "البحث",
  description:
    "مدخل واحد إلى مرصد إعادة إعمار لبنان: ابحث عن صفحة أو جهة فاعلة متتبَّعة أو بلدة أو مرحلة في سلسلة القيمة أو طبقة جهات أو مؤشّر أو محطة زمنية، بالعربية أو بالإنجليزية.",
  alternates: localeAlternates("/search", "ar"),
};

/**
 * البحث في الموقع كله. الصفحة العربية تشغّل الوحدة نفسها التي تشغّلها
 * الصفحة الإنجليزية وبالعمق نفسه: الفهرس واحد للّغتين، فالاستعلام
 * بالعربية يبلغ الوجهة التي يبلغها نظيره بالإنجليزية تماماً.
 */
export default function Page() {
  return (
    <ArabicPageShell
      title="ابحث في المرصد"
      lede="حقل واحد على الموقع كله: كل صفحة من صفحات التحليل وأقسامها، وكل جهة فاعلة متتبَّعة في السجل، والبلدات المسمّاة والتجمّعات الإقليمية، ومراحل سلسلة القيمة الاثنتي عشرة، وطبقات الجهات الأربع، والمؤشرات والمحطات الزمنية. العربية والإنجليزية تبلغان الوجهة نفسها، فالاستعلام بأيّ منهما يجدها."
      point={
        <>
          يبحث هذا الحقل في صفحات المرصد نفسها. وهو لا يبلغ شريط المستجدات
          المباشر، ولا يقرأ النص الكامل لكل مدخل متتبَّع - ولكلٍّ منهما بحثه على
          صفحته:{" "}
          <Link
            href="/ar/explorer"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            مستكشف المدخلات
          </Link>{" "}
          و
          <Link
            href="/ar/news"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            صفحة المستجدات
          </Link>
          .
        </>
      }
      englishHref="/search"
    >
      <section aria-labelledby="ar-search" className="mt-8">
        <h2 id="ar-search" className="sr-only">
          البحث
        </h2>
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}
        >
          <SiteSearch locale="ar" />
        </Suspense>
      </section>
    </ArabicPageShell>
  );
}
