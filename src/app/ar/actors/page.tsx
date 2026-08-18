import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import { roleRecords } from "@/lib/data";
import webUpdates from "@/data/web-updates.json";
import ArabicPageShell from "../ArabicPageShell";
import WaterRepairs from "@/components/WaterRepairs";
import ReportedUpdates from "@/components/ReportedUpdates";
import ServiceOperators from "@/components/ServiceOperators";
import Takeaways from "@/components/Takeaways";
import ActorTreemap from "@/components/charts/ActorTreemap";
import ActorStageMatrix from "../../actors/ActorStageMatrix";
import ActorRegister from "../../actors/ActorRegister";
import { layers } from "@/lib/vocab";

export const metadata: Metadata = { title: AR.pages.actors.title };

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
      <div className="mt-10">
        <ActorStageMatrix locale="ar" />
      </div>
      <div className="mt-10">
        <ActorRegister locale="ar" />
      </div>
      <div className="mt-10">
        <ReportedUpdates locale="ar" />
      </div>
      <div className="mt-8">
        <WaterRepairs locale="ar" />
      </div>
      <div className="mt-8">
        <ServiceOperators locale="ar" />
      </div>
      <div className="mt-10">
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
