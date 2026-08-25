import type { Metadata } from "next";
import { Suspense } from "react";
import { AR, localeAlternates } from "@/lib/i18n";
import { roleRecords } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";
import ComparePanel from "@/app/(en)/compare/ComparePanel";
import StageCompositionChart from "@/components/charts/StageCompositionChart";
import LayerSlopeChart from "@/components/charts/LayerSlopeChart";
import YearHeatmaps from "@/components/charts/YearHeatmaps";
import ThreeStreams from "@/components/ThreeStreams";
import DisplacementCycle from "@/components/DisplacementCycle";
import Takeaways from "@/components/Takeaways";

export const metadata: Metadata = {
  title: AR.pages.compare.title,
  description: AR.pages.compare.desc,
  alternates: localeAlternates("/compare", "ar"),
};

const SUMMARY_2024 = [
  "قيادتها الطوارئ",
  "ثقيلة على التقييم",
  "مفكّكة مؤسسياً",
  "معتمدة على الإنجاز الإنساني",
  "متّكلة على إحلال البلديات والمنظمات والمجتمع المحلي والأسر",
  "تفتقر إلى برنامج إعادة إعمار وطني مموَّل",
  "تتّسم بمساءلة متفاوتة",
  "أقوى في الاستجابة الفورية منها في الانتقال إلى إعادة الإعمار",
];

const SUMMARY_2026 = [
  "أكثر توجيهاً من المركز",
  "منظَّمة حول بنية مشروع رسمية",
  "مرتبطة بتمويل خارجي",
  "منفَّذة عبر وحدة المشروع في مجلس الإنماء والإعمار والوزارات والمتعهّدين",
  "محكومة بإجراءات الشراء والضمانات والشكاوى والرقابة الخاصة بالمشروع",
  "ما زالت ضعيفة في الصلاحية المالية البلدية",
  "ما زالت محدودة في الدفع",
  "أكثر تقدّماً في الإجراءات والشراء منها في الإنجاز المادي المكتمل",
];

export default function Page() {
  const y24 = roleRecords.filter((r) => r.year === 2024).length;
  const y26 = roleRecords.filter((r) => r.year === 2026).length;
  // The hero counts stay on one grain: the finer entry log. The matrix's
  // report-level actor-stage counts belong to the charts below, which carry
  // their own caveat.
  const rows26 = (layerId: string) =>
    roleRecords.filter((r) => r.year === 2026 && r.actorLayer === layerId)
      .length;

  return (
    <ArabicPageShell
      title={AR.pages.compare.title}
      lede={AR.pages.compare.lede}
      point={AR.pages.compare.point}
      englishHref="/compare"
      figures={[
        { value: String(y24), label: "مدخل متتبَّع في 2024" },
        { value: String(y26), label: "مدخل متتبَّع في 2026" },
        {
          value: String(rows26("community")),
          label: "منها للمجتمع المحلي في 2026",
        },
        {
          value: String(rows26("municipal")),
          label: "منها للبلديات في 2026",
        },
      ]}
    >
      <div className="mt-6">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
          <ComparePanel locale="ar" />
        </Suspense>
      </div>

      {/* Year summaries */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section
          aria-label="خلاصة 2024"
          className="rounded-md border-t-4 bg-white p-5"
          style={{ borderTopColor: "var(--color-y2024)" }}
        >
          <h2 className="text-lg font-semibold text-[color:var(--color-navy)]">
            2024: إحلال في الطوارئ
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--color-text)]">
            {SUMMARY_2024.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-y2024)]" />
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-label="خلاصة 2026"
          className="rounded-md border-t-4 bg-white p-5"
          style={{ borderTopColor: "var(--color-y2026)" }}
        >
          <h2 className="text-lg font-semibold text-[color:var(--color-navy)]">
            2026: بنية مبرمَجة
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--color-text)]">
            {SUMMARY_2026.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-y2026)]" />
                {s}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Comparative conclusion */}
      <section
        aria-label="الخلاصة المقارِنة"
        className="mt-7 rounded-md border-s-4 border-[color:var(--color-navy)] bg-white p-6"
      >
        <blockquote className="editorial-quote max-w-4xl text-lg leading-relaxed text-[color:var(--color-navy)]">
          لم يكن التحوّل من إنجاز خارج الدولة إلى إنجاز داخلها. كان من إحلال
          مفكّك إلى سلسلة مشروع مُدارة مركزياً، اكتسبت فيها المؤسسات الوطنية
          والتمويل الخارجي والمتعهّدون أدواراً أوضح، فيما بقيت البلديات
          والمجتمعات المحلية أساسية وضعيفة التمكين.
        </blockquote>
      </section>

      {/* The 2026 structural qualification */}
      <div className="mt-8">
        <ThreeStreams locale="ar" />
      </div>

      {/* Composition data */}
      <div className="mt-8 space-y-7">
        <LayerSlopeChart locale="ar" />
        {/* The standing counts caution prints once, on YearHeatmaps. */}
        <YearHeatmaps locale="ar" />
        <StageCompositionChart showCaveat={false} locale="ar" />
      </div>

      {/* The delivery the system proved, twice */}
      <div className="mt-8">
        <DisplacementCycle locale="ar" />
      </div>

      <div className="mt-8">
        <Takeaways
          locale="ar"
          changed="اكتسبت السلطة والتمويل والشراء أصحاباً بالاسم داخل محيط مشروع رسمي؛ وأُعيد جزء من التقييم إلى مؤسسات لبنانية؛ ونظام الطوارئ تحسّن في مهمته هو."
          unchanged="الصلاحية المالية البلدية، والإنجاز المادي المؤكَّد، والتعويض المؤكَّد: صفر حركة في الثلاثة. وواصلت الأسر والمجتمعات المحلية امتصاص كلفة كل أسبوع تأخير."
          matters="نظام أكثر تماسكاً على الورق وبلا تغيّر في قاعه هو نظام غير مستقر: الأبعاد الكهرمانية - التمويل والشراء والرقابة - ستحسم نحو الإنجاز أو نحو الإجراء خلال دورة الإبلاغ المقبلة، والتتبّع صار موجوداً ليُخضِع كل تحوّل منها لتاريخ."
        />
      </div>
    </ArabicPageShell>
  );
}
