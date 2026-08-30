import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import { AR, localeAlternates } from "@/lib/i18n";
import { locations, roleRecords } from "@/lib/data";
import webUpdates from "@/data/web-updates.json";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import LayerSlopeChart from "@/components/charts/LayerSlopeChart";
import YearHeatmaps from "@/components/charts/YearHeatmaps";
import ChangeHeatmap from "@/components/charts/ChangeHeatmap";
import StageCompositionChart from "@/components/charts/StageCompositionChart";
import LebanonMap from "@/components/map/LebanonMap";
import RegionalComposition from "@/components/map/RegionalComposition";
import ActorTreemap from "@/components/charts/ActorTreemap";
import ActorStageMatrix from "@/app/(en)/who/ActorStageMatrix";
import ActorRegister from "@/app/(en)/who/ActorRegister";
import ActorTabs from "@/app/(en)/who/ActorTabs";
import { cautionCounts, layers } from "@/lib/vocab";

export const metadata: Metadata = {
  title: AR.pages.who.title,
  description: AR.pages.who.desc,
  alternates: localeAlternates("/who", "ar"),
};

export default function Page() {
  // Layer names come from the shared vocabulary, so the two languages can
  // never drift apart on what a layer is called. The values are entry counts
  // for the two years together, and the label says so.
  const counts = layers("ar").map((l) => ({
    value: String(roleRecords.filter((r) => r.actorLayer === l.id).length),
    label: `${l.label} (مدخلات السنتين معاً)`,
  }));
  const south = webUpdates.updates.filter((u) => u.southOfLitani).length;
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;
  return (
    <ArabicPageShell
      title={AR.pages.who.title}
      lede={AR.pages.who.lede}
      point={AR.pages.who.point}
      englishHref="/who"
      figures={counts}
    >
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text-secondary">
        إضافةً إلى ما سبق، يحمل المرصد {webUpdates.updates.length} مدخلاً من تغطية
        مفتوحة على الإنترنت، منها {south} بين الليطاني والخط الأزرق. هذه المدخلات
        غير مؤكَّدة ولا تدخل في أي عدّ.
      </p>

      {/* The full per-layer analytical narrative, the same module the
          English page mounts: profiles, direct change, gains and losses,
          chain roles, core findings, mandate-versus-capacity notes and the
          layer figures, tab by tab. */}
      <section aria-labelledby="ar-layer-profiles" className="mt-8">
        <h2
          id="ar-layer-profiles"
          className="text-xl font-semibold text-navy"
        >
          الطبقات الأربع، طبقةً طبقة
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
          لكل طبقة ملامحها في السنتين، وتغيّرها المباشر بمكاسبه وخسائره،
          وأدوارها على السلسلة، وشكلها على امتدادها، وجغرافيتها، والجهات التي
          تحملها. الأشرطة أعداد حضور مرصود، لا مقاييس إنجاز.
        </p>
        <div className="mt-4">
          <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
            <ActorTabs locale="ar" />
          </Suspense>
        </div>
        <p className="mt-4 note-caution text-xs leading-relaxed text-text-secondary">
          {cautionCounts("ar")}
        </p>
      </section>

      {/* The same modules the English page carries. */}
      <div className="mt-8">
        <ActorTreemap locale="ar" />
      </div>
      {/* كيف تحرّك حضور كل طبقة بين الحربين. */}
      <div className="mt-7">
        <LayerSlopeChart locale="ar" />
      </div>
      {/* السنتان جنباً إلى جنب، ثم الفرق بينهما. كان الزوج هنا والفرق على
          الصفحة الرئيسية، فانقسم شكل واحد على مسارين؛ والتنبيه يُطبع مرة
          واحدة، على أوّلهما. */}
      <div className="mt-7">
        <YearHeatmaps locale="ar" />
      </div>
      <div className="mt-7">
        <ChangeHeatmap locale="ar" showCaveat={false} />
      </div>
      <div className="mt-7">
        <StageCompositionChart locale="ar" showCaveat={false} />
      </div>

      <div className="mt-7">
        <ActorStageMatrix locale="ar" />
      </div>
      <div className="mt-7">
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

      <section id="ar-no-national-layer" className="card mt-8 max-w-3xl text-sm leading-relaxed">
        <h2 className="text-xl font-semibold text-navy">
          لماذا لا توجد طبقة أضرار وطنية
        </h2>
        <p className="mt-2 text-text">
          التقييمات السريعة لعام 2026 تغطّي منطقتين اثنتين - جنوب الليطاني
          (مراجَعة مكتبياً) وبيروت وجبل لبنان (مسح ميداني) - بينما البقاع
          وبعلبك-الهرمل، وقد بلغتهما الحرب، بقيا بلا تقييم مكافئ حتى تاريخ
          الإقفال. جمع هذه المنتجات الجزئية في مقياس أضرار وطني واحد يصنع
          مقارنة زائفة، لذلك لا يضع هذا المرصد تقديرات الأضرار على مفتاح
          مشترك. أرقام كل منطقة، بشارة قابلية المقارنة وطريقة التثبّت، على{" "}
          <a href="/ar/destroyed" className="underline underline-offset-2">
            صفحة بيانات الأضرار
          </a>
          ، إلى جانب مسارات عدّ المباني الأربعة غير القابلة للجمع لعام 2024.
        </p>
      </section>

      <div className="mt-7">
        <Takeaways
          locale="ar"
          changed="اتّسع الحضور الرسمي في 2026 وظهرت سلسلة أوضح للتمويل والشراء والرقابة."
          unchanged="البلديات ما زالت بلا صلاحيات فعلية ولا موارد تكافئ ما يُطلب منها."
          matters="ما يظهر فعلياً في القرى الجنوبية يقوم به الأهالي والجمعيات والبلديات، وغالباً على نفقتهم."
        />
      </div>
    </ArabicPageShell>
  );
}
