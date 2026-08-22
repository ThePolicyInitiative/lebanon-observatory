import type { Metadata } from "next";
import { AR, localeAlternates } from "@/lib/i18n";
import { roleRecords } from "@/lib/data";
import webUpdates from "@/data/web-updates.json";
import ArabicPageShell from "../ArabicPageShell";
import WaterRepairs from "@/components/WaterRepairs";
import ReportedUpdates from "@/components/ReportedUpdates";
import ServiceOperators from "@/components/ServiceOperators";
import Takeaways from "@/components/Takeaways";
import ActorTreemap from "@/components/charts/ActorTreemap";
import ActorStageMatrix from "@/app/(en)/actors/ActorStageMatrix";
import ActorRegister from "@/app/(en)/actors/ActorRegister";
import LayerStageProfile from "@/components/charts/LayerStageProfile";
import RegionPresence from "@/components/charts/RegionPresence";
import ActorConcentration from "@/components/charts/ActorConcentration";
import { cautionCounts, layers } from "@/lib/vocab";

export const metadata: Metadata = {
  title: AR.pages.actors.title,
  description: AR.pages.actors.desc,
  alternates: localeAlternates("/actors", "ar"),
};

export default function Page() {
  // Layer names come from the shared vocabulary, so the two languages can
  // never drift apart on what a layer is called.
  const counts = layers("ar").map((l) => ({
    value: String(roleRecords.filter((r) => r.actorLayer === l.id).length),
    label: l.label,
  }));
  const south = webUpdates.updates.filter((u) => u.southOfLitani).length;
  return (
    <ArabicPageShell
      title={AR.pages.actors.title}
      lede={AR.pages.actors.lede}
      point={AR.pages.actors.point}
      englishHref="/actors"
      figures={counts}
    >
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        إضافةً إلى ما سبق، يحمل المرصد {webUpdates.updates.length} مدخلاً من تغطية
        مفتوحة على الإنترنت، منها {south} بين الليطاني والخط الأزرق. هذه المدخلات
        غير مؤكَّدة ولا تدخل في أي عدّ.
      </p>

      {/* The same modules the English page carries. */}
      <div className="mt-8">
        <ActorTreemap locale="ar" />
      </div>
      <div className="mt-7">
        <ActorStageMatrix locale="ar" />
      </div>

      {/* The English side puts these behind a tab per layer; here they
          run one after another, which needs no tab machinery and lets a
          reader compare the four shapes without switching. */}
      <section aria-labelledby="ar-layer-profiles" className="mt-8">
        <h2
          id="ar-layer-profiles"
          className="text-xl font-semibold text-[color:var(--color-navy)]"
        >
          الطبقات الأربع، طبقةً طبقة
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          لكل طبقة شكلها على امتداد السلسلة، وجغرافيتها، والجهات التي تحملها.
          الأشرطة أعداد حضور مرصود، لا مقاييس إنجاز.
        </p>
        {layers("ar").map((l) => (
          <div key={l.id} className="mt-8">
            <h3 className="text-lg font-semibold" style={{ color: l.color }}>
              {l.label}
            </h3>
            <div className="mt-3 space-y-4">
              <LayerStageProfile layer={l.id} locale="ar" showCaveat={false} />
              <RegionPresence layer={l.id} locale="ar" showCaveat={false} />
              <ActorConcentration layer={l.id} locale="ar" showCaveat={false} />
            </div>
          </div>
        ))}
        <p className="mt-4 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
          {cautionCounts("ar")}
        </p>
      </section>
      <div className="mt-7">
        <ActorRegister locale="ar" />
      </div>
      <div className="mt-7">
        <ReportedUpdates locale="ar" />
      </div>
      <div className="mt-8">
        <WaterRepairs locale="ar" />
      </div>
      <div className="mt-8">
        <ServiceOperators locale="ar" />
      </div>
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
