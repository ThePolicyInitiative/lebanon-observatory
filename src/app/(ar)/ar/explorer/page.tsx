import type { Metadata } from "next";
import { Suspense } from "react";
import { AR, localeAlternates } from "@/lib/i18n";
import { slimRecords } from "@/lib/map-records";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import ExplorerClient from "@/app/(en)/explorer/ExplorerClient";

export const metadata: Metadata = {
  title: AR.pages.explorer.title,
  description: AR.pages.explorer.desc,
  alternates: localeAlternates("/explorer", "ar"),
};

/**
 * The Arabic explorer mounts the same module as the English page, in
 * Arabic: the free-text search, every filter, the result profile and the
 * per-entry drawer run here at the same depth, over the same tracking,
 * so a filtered view says the same thing in both languages.
 */
export default function Page() {
  return (
    <ArabicPageShell
      title={AR.pages.explorer.title}
      lede={AR.pages.explorer.lede}
      point={AR.pages.explorer.point}
      englishHref="/explorer"
      figures={[
        { value: String(slimRecords.length), label: "مدخل متتبَّع" },
        { value: "105 ← 130", label: "جهة فاعلة، 2024 ثم 2026" },
        { value: "12", label: "مرحلة في سلسلة القيمة" },
        { value: "2", label: "سنتان تحت المقارنة" },
      ]}
    >
      <section aria-labelledby="ar-explorer" className="mt-8">
        <h2 id="ar-explorer" className="text-xl font-semibold text-[color:var(--color-navy)]">
          من فعل ماذا، وأين
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          التتبّع الأساسي نفسه: صف واحد لكل جهة ووظيفة متتبَّعة، للسنتين 2024
          و2026. الصفوف تدل على حضور متتبَّع - لا على أداء أبداً. وأعداد
          المراحل في الرسوم تُعاد على مستوى المدخل من هذه القاعدة، فصفوف
          المستكشف أدق تفصيلاً من أرقام الرسوم بحكم البناء.
        </p>
        <div className="mt-5">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}>
            <ExplorerClient locale="ar" />
          </Suspense>
        </div>
        <p className="mt-6 note-caution text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          البحث الحر والترشيح على كل المحاور معاً وفتح المدخل الواحد بتفصيله
          الكامل تعمل في هذه الصفحة بالعربية. نص كل مدخل يظهر بالعربية حيث
          له نظير عربي في التتبّع، ويبقى بلغته الأصلية وباتجاه كتابتها حيث
          لا نظير له، وأسماء الجهات تظهر كما وردت في التتبّع نفسه.
        </p>
      </section>

      <div className="mt-7">
        <Takeaways
          locale="ar"
          changed="عدد المدخلات ارتفع بين السنتين واتّسعت الطبقة الرسمية داخلها."
          unchanged="أغلب المدخلات تبقى حضوراً متتبَّعاً أو تفويضاً، لا إنجازاً مكتملاً."
          matters="ما يُعدّ هنا هو ما يقوله الإبلاغ، لا ما جرى على الأرض. والفارق بينهما هو موضوع هذا الموقع."
        />
      </div>
    </ArabicPageShell>
  );
}
