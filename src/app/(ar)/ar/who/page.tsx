import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import { localeAlternates } from "@/lib/i18n";
import { locations } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import ChangeHeatmap from "@/components/charts/ChangeHeatmap";
import StageCompositionChart from "@/components/charts/StageCompositionChart";
import LebanonMap from "@/components/map/LebanonMap";
import RegionalComposition from "@/components/map/RegionalComposition";
import ActorTreemap from "@/components/charts/ActorTreemap";
import ActorStageMatrix from "@/app/(en)/who/ActorStageMatrix";
import ActorRegister from "@/app/(en)/who/ActorRegister";
import ActorTabs from "@/app/(en)/who/ActorTabs";
import GroupCards from "@/app/(en)/who/GroupCards";
import CategoryMix from "@/app/(en)/who/CategoryMix";
import SeeMore from "@/components/SeeMore";
import { AIM } from "@/lib/framework";

export const metadata: Metadata = {
  title: "من يفعل ماذا؟",
  description:
    "كل جهة رُصدت وهي تتحرك في استجابتي لبنان بعد الحربين، مصنّفة في مجموعات التقرير الأربع - من تضم كل مجموعة، وما رُصدت وهي تفعله في 2024 و2026، وخريطة مواقع النشاط المرصود.",
  alternates: localeAlternates("/who", "ar"),
};

/**
 * الصفحة تتبع إطار الجهات في التقرير: تفتح بتعريف المجموعات الأربع، ثم
 * تتعمّق مجموعةً مجموعة، ثم تقرأ المجموعات جنباً إلى جنب والعمل بحسب
 * نوعه. مقارنات المجموعات تُرسم على مقياس البيانات ولا تُرقَّم أبداً؛
 * وتفاصيل المجموعة الواحدة ومجاميع الفئات والمراحل عبر المجموعات كلها
 * تحتفظ بأعدادها.
 */
export default function Page() {
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;
  const actorFrame = AIM.ar.layers.find((l) => l.id === "actors")!;

  return (
    <ArabicPageShell
      title="من يفعل ماذا؟"
      lede={actorFrame.body}
      englishHref="/who"
    >
      {/* إطار الجهات في التقرير، قبل أي شكل مبني عليه. */}
      <GroupCards locale="ar" />

      <section aria-labelledby="ar-group-profiles" className="mt-9">
        <h2 id="ar-group-profiles" className="text-h2 font-semibold text-navy">
          كل مجموعة على حدة
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          اختر مجموعة: من يحملها، وكيف بدت كل سنة، وأين اتّسع نشاطها
          المرصود أو ضاق بين الحربين.
        </p>
        <div className="mt-4">
          <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
            <ActorTabs locale="ar" />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="ar-who-carries-the-work" className="mt-9">
        <h2 id="ar-who-carries-the-work" className="text-h2 font-semibold text-navy">
          من يحمل العمل
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          خلية لكل جهة مرصودة، بمساحة توازي نشاطها المرصود، مجموعةً في
          المجموعات الأربع - المشهد كله على لوحة واحدة.
        </p>
        <div className="mt-4">
          <ActorTreemap locale="ar" />
        </div>
      </section>

      <section aria-labelledby="ar-stages-held" className="mt-9">
        <h2 id="ar-stages-held" className="text-h2 font-semibold text-navy">
          أي المجموعات شغلت كل مرحلة من مراحل الاستجابة
        </h2>
        <div className="mt-4">
          <StageCompositionChart locale="ar" showCaveat={false} />
        </div>
      </section>

      <section aria-labelledby="ar-what-shifted" className="mt-9">
        <h2 id="ar-what-shifted" className="text-h2 font-semibold text-navy">
          ما الذي تبدّل بين الحربين
        </h2>
        {/* الشبكة الوحيدة القابلة للتجوال بلوحة المفاتيح على الصفحة؛
            وتنبيه الأعداد الدائم يُطبع هنا مرة واحدة تحتها. */}
        <div className="mt-4">
          <ChangeHeatmap locale="ar" />
        </div>
        <SeeMore label="كل جهة مرصودة مقابل كل مرحلة من مراحل الاستجابة" locale="ar">
          <ActorStageMatrix locale="ar" />
        </SeeMore>
      </section>

      <CategoryMix locale="ar" />

      <div className="mt-9">
        <ActorRegister locale="ar" />
      </div>

      {/*
       * أين رُصد عمل الجهات نفسها. الخريطة ليست تبويباً لأن "الخريطة" ليست
       * سؤالاً يصل به القارئ، بل هي كيف يُرسم جواب هذه الصفحة.
       */}
      <section aria-labelledby="ar-where-traced" className="mt-9">
        <h2 id="ar-where-traced" className="text-h2 font-semibold text-navy">
          أين يقع النشاط المرصود
        </h2>
        {/* أول ما يحتاجه القارئ من الخريطة هو ما تستطيع عرضه وما لا تستطيع. */}
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            [String(locations.regions.length), "تجمّعات إقليمية في الرصد"],
            [String(mappable), "منها يمكن وضعها على الخريطة"],
            [String(notMappable), "تُعرض على حدة - يتعذّر تحديد موقعها"],
          ].map(([value, label]) => (
            <div key={label} className="card">
              <dt className="figure-number text-h2 font-semibold text-navy">{value}</dt>
              <dd className="text-meta text-text-secondary">{label}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <Suspense fallback={<div className="h-[680px] animate-pulse rounded-md bg-white" />}>
            <LebanonMap locale="ar" />
          </Suspense>
        </div>
        <div className="mt-7">
          <RegionalComposition locale="ar" showCaveat={false} />
        </div>
      </section>

      {/* سطر واحد: البيت الوحيد لهذا الشرح هو صفحة الأضرار. */}
      <section id="ar-no-national-layer" className="card mt-8 max-w-3xl text-body leading-relaxed">
        <h2 className="text-h3 font-semibold text-navy">
          لماذا لا توجد طبقة أضرار وطنية
        </h2>
        <p className="mt-1 text-text">
          تقييمات 2026 تغطي منطقتين اثنتين ولا يمكن جمعها في مقياس وطني
          واحد - أرقام المناطق والشرح الكامل على{" "}
          <a href="/ar/destroyed" className="underline underline-offset-2">
            صفحة الأضرار
          </a>
          .
        </p>
      </section>

      <div className="mt-8">
        <Takeaways
          locale="ar"
          changed="اتّسعت المبادرات الأهلية نحو الإغاثة والتنسيق ودعم الإيواء، وترسّمت الجهة الرسمية في سلسلة مبرمجة للتمويل والشراء والرقابة حول خطة 2026."
          unchanged="الإنجاز. بقيت السنتان متركّزتين في العمل الذي يُعدّ للتعافي لا العمل الذي يُنهيه، وبقيت البلديات تحمل العمل من دون موازنات أو صلاحيات."
          matters="بنية أوضح بلا موارد تحرّك الأوراق لا التعافي: من يقف عند نهاية الوظيفة الغائبة - والأسر أولاً - يبقى هو من يدفع الثمن."
        />
      </div>
    </ArabicPageShell>
  );
}
