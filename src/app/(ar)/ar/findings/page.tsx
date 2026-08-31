import type { Metadata } from "next";
import Link from "next/link";
import { AR, localeAlternates } from "@/lib/i18n";
import { finding } from "@/lib/framework";
import { finance } from "@/lib/data";
import destruction from "@/data/destruction.json";
import ArabicPageShell from "../ArabicPageShell";
import FinanceFunnel from "@/components/charts/FinanceFunnel";
import DeliveryTimeline from "@/components/charts/DeliveryTimeline";
import FunctionSpeedChart from "@/components/charts/FunctionSpeedChart";
import DisbursementWaffle from "@/components/charts/DisbursementWaffle";
import LeapComponentsChart from "@/components/charts/LeapComponentsChart";
import MilestoneGantt from "@/components/charts/MilestoneGantt";
import SectorDamageChart from "@/components/charts/SectorDamageChart";
import WorstCadastersChart from "@/components/charts/WorstCadastersChart";
import DebrisTiles from "@/components/charts/DebrisTiles";
import DistrictDamageChart from "@/components/charts/DistrictDamageChart";
import LeapResultsBoard from "@/components/LeapResultsBoard";
import CompensationTracks from "@/components/CompensationTracks";
import ServiceImpact from "@/components/ServiceImpact";
import HumanToll from "@/components/HumanToll";
import DisplacementCycle from "@/components/DisplacementCycle";
import WaterRepairs from "@/components/WaterRepairs";
import ServiceOperators from "@/components/ServiceOperators";
import InstitutionalStructures from "@/components/InstitutionalStructures";
import ThreeStreams from "@/components/ThreeStreams";
import SeeMore from "@/components/SeeMore";
import Takeaways from "@/components/Takeaways";
import { FigureTile, Onward } from "@/components/HomeNarrative";
import { comparabilityLabel } from "@/lib/vocab";
import { fmtUsd, fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: AR.pages.findings.title,
  description: AR.pages.findings.desc,
  alternates: localeAlternates("/findings", "ar"),
};

/** The six concepts public debate merges, kept apart under finding 2 as on the English page. */
const CONCEPTS = [
  {
    n: 1,
    label: "الاحتياج المقدَّر",
    text: "11 مليار دولار لحرب 2023-24 بحسب تقييم RDNA. والاحتياج ليس خطة وليس مالاً.",
  },
  {
    n: 2,
    label: "إطار التمويل",
    text: "إطار LEAP القابل للتوسّع بمليار دولار - ظرف يمكن أن يتدفّق إليه التمويل، بقي ثلاثة أرباعه فارغاً عند آخر مراجعة.",
  },
  {
    n: 3,
    label: "التمويل المُقر",
    text: "القرض الأولي من البنك الدولي بقيمة 250 مليون دولار: أُقر في حزيران 2025، وأُبرم في كانون الأول 2025، ونفذ في 26 شباط 2026.",
  },
  {
    n: 4,
    label: "الدفع",
    text: "4.13 مليون دولار - أي 1.65% من القرض - دُفعت حتى 29 حزيران 2026. والدفع يغطّي التحضير كما يغطّي الأشغال، وليس إنجازاً.",
  },
  {
    n: 5,
    label: "الشراء",
    text: "ثلاث حزم خدمات استشارية نُشرت بين شباط وأيار 2026 ولم يُعرض إرساء أي منها عند مراجعة البوابة في 17 تموز؛ ثم ظهرت على البوابة بين 23 تموز و13 آب أولى الإرساءات الاستشارية الصغيرة، وأُطلقت أول مناقصة أشغال في 21 آب 2026 - وعقود الأشغال لا تزال عند الصفر.",
  },
  {
    n: 6,
    label: "الإنجاز المكتمل",
    text: "لا إنجاز إعادة إعمار مكتمل ومُعلَن، ولا عقد أشغال مُرسى، ولا دفعة تعويض حكومية مؤكَّدة عند آخر مراجعة.",
  },
];

/** The check date is in the section's opening line; the cards need only the status. */
const PORTAL_STATUS_AR: Record<string, string> = {
  "Under evaluation": "قيد التقييم",
  "No award displayed": "لا إرساء معروض",
};

/**
 * The numbered heading that opens each finding. The five ids are shared
 * with the English page, so #finding-* links land on the same title in
 * either language.
 */
function FindingHeading({
  index,
  id,
  title,
}: {
  index: number;
  id: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="flex items-center gap-2.5 font-sans text-micro font-bold tracking-widest text-teal">
        {String(index).padStart(2, "0")}
        <span aria-hidden className="h-px w-8 bg-amber" />
      </p>
      <h2 id={id} className="mt-2 text-h2 font-semibold text-navy">
        {title}
      </h2>
    </div>
  );
}

/**
 * The Arabic findings chapter mirrors the English one section for
 * section: the five findings from framework.ts, each carrying its depth
 * here - the old /ar/destroyed and /ar/money pages folded into this one,
 * keeping their ar-* section ids so deep links keep landing.
 */
export default function Page() {
  const needs = finding("needs", "ar");
  const frameworks = finding("frameworks", "ar");
  const plan = finding("plan", "ar");
  const community = finding("community", "ar");
  const stages = finding("stages", "ar");

  return (
    <ArabicPageShell
      title={AR.pages.findings.title}
      lede={AR.pages.findings.lede}
      point={AR.pages.findings.point}
      englishHref="/findings"
    >
      <div className="mt-10 space-y-16">
        {/* ------------------------------------------------------------ */}
        {/* Finding 1: needs beyond capacity, with the damage depth       */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-needs">
          <FindingHeading index={1} id="finding-needs" title={needs.title} />
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {needs.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {needs.body[1]}
          </p>

          <div
            role="group"
            aria-label="الأرقام الرئيسية الثلاثة لتقييم 2024"
            className="mt-6 grid max-w-4xl gap-4 sm:grid-cols-3"
          >
            <FigureTile locale="ar" value="6.8 مليارات دولار" label="أضرار مادية" />
            <FigureTile locale="ar" value="7.2 مليارات دولار" label="خسائر اقتصادية" />
            <FigureTile
              locale="ar"
              value="نحو 11 مليار دولار"
              label="احتياجات التعافي وإعادة الإعمار"
            />
          </div>

          <p className="mt-5 max-w-3xl text-body leading-loose text-text-secondary">
            التقديرات التي يقوم عليها هذان الرقمان تأتي تباعاً، معروضةً كل
            منها بمنهجيتها ونطاقها ووحدتها وقابليتها للمقارنة - ولا تُجمع ولا
            يؤخذ متوسطها ولا تُدمج أبداً. لا يوجد عدّ واحد لأبنية حرب 2024،
            ولم يكن لحرب 2026 أي تقييم وطني عند آخر مراجعة؛ وتعدّد التقديرات
            أعطى الاستجابة أسرع أرقامها المبكرة وأخّر خط الأساس الواحد الذي
            يحتاجه أي نظام تعويض.
          </p>

          {/* 2024: four non-additive tracks */}
          <section aria-labelledby="ar-tracks" className="mt-7">
            <h3 id="ar-tracks" className="text-h3 font-semibold text-navy">
              2024: أربعة مسارات غير قابلة للجمع تحصر الدمار
            </h3>
            <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
              الفارق بين المسارات ناتج عن المنهجية (رادار مقابل صور بصرية مقابل إفادة
              بلدية)، والنطاق (أربع محافظات مقابل ست)، والوحدة (مبانٍ مقابل مساكن)،
              والتوقيت - لا عن خطأ.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {destruction.tracks2024.map((t) => (
                <article key={t.id} className="flex flex-col card">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-body font-semibold leading-snug text-navy">
                      {t.labelAr}
                    </h4>
                    <span className="shrink-0 rounded-sm bg-[#F7E9E5] px-1.5 py-0.5 text-micro font-semibold text-rust">
                      {comparabilityLabel(t.comparability, "ar")}
                    </span>
                  </div>
                  <p className="mt-2 figure-number text-h3 text-navy">
                    {t.headlineAr}
                  </p>
                  <p className="mt-2 flex-1 text-meta leading-relaxed text-text">
                    {t.detailAr}
                  </p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-border pt-2.5 text-micro text-text-secondary">
                    <div>
                      <dt className="font-semibold">المنهجية</dt>
                      <dd>{t.methodAr}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">النطاق</dt>
                      <dd>{t.scopeAr}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">الوحدة</dt>
                      <dd>{t.unitAr}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <div className="mt-4 card">
              <h4 className="text-body font-semibold text-navy">ركام 2024</h4>
              <p className="mt-1 figure-number text-h3 text-navy">
                {destruction.debris2024.headlineAr}
              </p>
              <p className="mt-1.5 max-w-3xl text-meta leading-relaxed">
                {destruction.debris2024.detailAr}
              </p>
            </div>
          </section>

          {/* The municipal survey, district by district */}
          <div className="mt-7">
            <DistrictDamageChart locale="ar" />
          </div>

          <div className="mt-7">
            <SectorDamageChart locale="ar" />
          </div>

          {/* 2026 zones */}
          <section aria-labelledby="ar-zones" className="mt-7">
            <h3 id="ar-zones" className="text-h3 font-semibold text-navy">
              2026: منطقتان مقيَّمتان فقط - لا صورة وطنية
            </h3>
            <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
              داخل حدودهما، تصف أرقام 2026 دماراً يقارب شدّة الجنوب في 2024 خلال ثلث
              المدة. المنتجان يستخدمان منهجيتَي تدقيق مختلفتين ولا يجوز أن يتقاسما مفتاح
              قراءة واحداً، ولا يُجمع أي منهما مع رقم من 2024.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {destruction.zones2026.map((z) => (
                <article key={z.id} className="flex flex-col card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-body font-semibold text-navy">
                      {z.labelAr}
                    </h4>
                    <div className="flex gap-1.5">
                      <span className="rounded-sm bg-[#E8F1F3] px-1.5 py-0.5 text-micro font-semibold text-teal">
                        {z.checkedByAr}
                      </span>
                      <span className="rounded-sm bg-[#F7E9E5] px-1.5 py-0.5 text-micro font-semibold text-rust">
                        {comparabilityLabel(z.comparability, "ar")}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 figure-number text-h3 text-navy">
                    {z.assessedDamageAr}
                  </p>
                  <p className="mt-2 text-meta leading-relaxed">
                    <span className="font-semibold">الأبنية: </span>
                    {z.buildingsAr}
                  </p>
                  <p className="mt-1.5 text-meta leading-relaxed">
                    <span className="font-semibold">الركام: </span>
                    {z.debrisAr}
                  </p>
                  {z.worstCadasters.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {z.worstCadasters.map((c) => (
                        <li key={c.name} className="chip bg-bg">
                          {c.nameAr ?? c.name}
                          <span className="ms-1 tabular-nums font-bold">
                            {c.destroyed.toLocaleString("en-US")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-2 text-micro leading-relaxed text-text-secondary">
                    <span className="font-semibold">المنهجية: </span>
                    {z.methodAr}
                  </p>
                  <p className="mt-1.5 text-micro leading-relaxed text-text-secondary">
                    <span className="font-semibold">القابلية للمقارنة: </span>
                    {z.comparabilityNoteAr}
                  </p>
                  <p className="mt-2 border-t border-dashed border-border pt-2.5 text-micro text-text-secondary">
                    نُشر في {fmtDate(z.published, "ar")} (البرنامج الإنمائي والمجلس
                    الوطني للبحوث العلمية في لبنان)
                  </p>
                </article>
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {destruction.zones2026NotesAr.map((n) => (
                <li
                  key={n.slice(0, 24)}
                  className="note-caution text-meta leading-relaxed text-text-secondary"
                >
                  {n}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-md border border-dashed border-border bg-white p-4">
              <p className="text-meta leading-relaxed text-text-secondary">
                <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 text-micro font-semibold">
                  {comparabilityLabel("context_only", "ar")}
                </span>{" "}
                {destruction.presidentialEstimate.detailAr}
              </p>
            </div>
          </section>

          <div className="mt-7">
            <WorstCadastersChart locale="ar" />
          </div>

          <div className="mt-7">
            <DebrisTiles locale="ar" />
          </div>

          <div className="mt-7">
            <HumanToll locale="ar" />
          </div>

          <div className="mt-8">
            <SeeMore locale="ar" label="دورة الإيواء والعودة، جرت مرتين">
              <DisplacementCycle locale="ar" />
            </SeeMore>
          </div>

          {/* Services and networks: the operator-reported account in one place,
              with the two long modules folded behind the dated sector figures. */}
          <section aria-labelledby="ar-services" className="mt-8">
            <h3 id="ar-services" className="text-h3 font-semibold text-navy">
              الخدمات والشبكات، كما أبلغت عنها المؤسسات المشغّلة
            </h3>
            <p className="mt-2 max-w-3xl text-body leading-loose text-text-secondary">
              ما الذي توقّف وما الذي عاد تحت حرب 2026، بالأرقام التي نشرتها
              المؤسسات المشغّلة نفسها. حالة القطاعات المؤرَّخة تتقدّم؛ والقائمتان
              الطويلتان تُفتحان تحتها.
            </p>
            <div className="mt-5">
              <ServiceImpact locale="ar" />
            </div>
            <SeeMore locale="ar" label="إصلاحات مؤسسة المياه، خطاً بخط">
              <WaterRepairs locale="ar" />
            </SeeMore>
            <SeeMore locale="ar" label="الشبكات، مؤسسة بمؤسسة">
              <ServiceOperators locale="ar" />
            </SeeMore>
          </section>

          <p className="mt-8 text-body">
            <Link
              href="/ar/actors"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              اطّلع على أين تركّز النشاط المرصود ←
            </Link>
          </p>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Finding 2: frameworks were not money, with the finance depth  */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-frameworks">
          <FindingHeading
            index={2}
            id="finding-frameworks"
            title={frameworks.title}
          />
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {frameworks.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {frameworks.body[1]}
          </p>

          <p className="mt-5 max-w-3xl text-body leading-loose text-text-secondary">
            يمسك مسار المال بستة مفاهيم منفصلة - الاحتياج والإطار والإقرار
            والدفع والشراء والإنجاز المكتمل - لأن دمجها هو ما يجعل عبارتَي
            «إعادة الإعمار جارية» و«إعادة الإعمار لم تبدأ» تُقالان بصدق معاً.
          </p>

          {/* Six concepts */}
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONCEPTS.map((c) => (
              <li key={c.n} className="card">
                <p className="text-micro font-bold tracking-widest text-teal">
                  {c.n}. {c.label}
                </p>
                <p className="mt-1.5 text-body leading-relaxed">{c.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-7">
            <FinanceFunnel locale="ar" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <DisbursementWaffle locale="ar" />
            <MilestoneGantt locale="ar" />
          </div>

          <div className="mt-6">
            <LeapComponentsChart locale="ar" />
          </div>

          <div className="mt-6">
            <SeeMore locale="ar" label="لوحة نتائج LEAP - ما وُعد به وموعده">
              <LeapResultsBoard locale="ar" />
            </SeeMore>
          </div>

          {/* LEAP components, folded: the chart above carries the shape */}
          <SeeMore locale="ar" label="داخل الـ250 مليون دولار الأولى، مكوّناً مكوّناً">
            <section aria-labelledby="ar-leap" className="card">
              <h3
                id="ar-leap"
                className="text-h3 font-semibold text-navy"
              >
                داخل الـ250 مليون دولار الأولى
              </h3>
              <p className="mt-1 text-body text-text-secondary">
                مخصّصات التقييم. أشغال إعادة الإعمار لم تُخصَّص لها مبالغ أولية عن قصد -
                فالأشغال تحتاج تحضيراً أولاً - وهو ما يترك فجوة الـ750 مليون دولار في
                الإطار للشركاء.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-meta tabular-nums">
                  <caption className="sr-only">مخصّصات مكوّنات LEAP</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-start font-semibold text-navy">المكوّن</th>
                      <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-end font-semibold text-navy">التمويل الأولي</th>
                      <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-end font-semibold text-navy">المقدَّر (الإطار الكامل)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.leapComponents.map((c) => (
                      <tr key={c.label} className="odd:bg-bg">
                        <td className="border-b border-border px-2 py-1.5">
                          {c.labelAr}
                          {"noteAr" in c && c.noteAr ? (
                            <span className="block text-micro text-text-secondary">{c.noteAr}</span>
                          ) : null}
                        </td>
                        <td className="border-b border-border px-2 py-1.5 text-end">
                          {c.initialUsd > 0 ? fmtUsd(c.initialUsd, "ar") : "-"}
                        </td>
                        <td className="border-b border-border px-2 py-1.5 text-end">{fmtUsd(c.appraisedUsd, "ar")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </SeeMore>

          {/* Procurement packages, folded */}
          <SeeMore locale="ar" label="حزم الشراء الثلاث وحالتها على البوابة">
            <section aria-labelledby="ar-procurement">
              <h3
                id="ar-procurement"
                className="text-h3 font-semibold text-navy"
              >
                حزم الشراء وحالتها الفعلية
              </h3>
              <p className="mt-1 max-w-3xl text-body text-text-secondary">
                الحالات كما كانت معروضة على بوابة الشراء في مجلس الإنماء والإعمار عند
                المراجعة في 17 تموز 2026. التمديدات وفترات التقييم أمر عادي بقواعد البنك
                الدولي، وغير عادي أمام الاحتياج اللبناني. وأحدّ إشارة هنا انعكاسية: جهة
                الرقابة من طرف ثالث اصطفّت في المسار البطيء نفسه الذي وُجدت لمراقبته.
                أما إعلانات البوابة اللاحقة لتلك المراجعة - أولى الإرساءات الاستشارية
                الصغيرة وأول مناقصة أشغال - فتُجمع على{" "}
                <a href="/ar/reported" className="underline underline-offset-2">
                  صفحة التغطية المباشرة
                </a>{" "}
                إلى أن تُقرأ ضمن التتبّع.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {finance.procurementPackages.map((p) => (
                  <article key={p.id} className="card">
                    <h4 className="text-body font-semibold leading-snug text-navy">
                      {p.labelAr}
                    </h4>
                    <dl className="mt-2 space-y-1 text-meta text-text-secondary">
                      <div className="flex gap-1.5">
                        <dt className="font-semibold">نُشرت:</dt>
                        <dd>{fmtDate(p.published, "ar")}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="font-semibold">الموعد النهائي:</dt>
                        <dd>
                          {fmtDate(p.deadline, "ar")}
                          {"extended" in p && p.extended ? " (مُمدَّد)" : ""}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 inline-block rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-micro font-semibold text-[#8a6200]">
                      {PORTAL_STATUS_AR[p.statusAtCheck] ?? p.statusAtCheck}
                    </p>
                  </article>
                ))}
              </div>
              <div className="mt-4 card text-body">
                <p>
                  <span className="font-semibold text-navy">
                    أهداف الإصلاح تقيس حجم الجبل:
                  </span>{" "}
                  خط أساس{" "}
                  <strong className="tabular-nums">{finance.procurementBaselines.worksContractWeeksBaseline} أسبوعاً</strong>{" "}
                  من الإعلان إلى توقيع عقد أشغال، مقابل هدف{" "}
                  <strong className="tabular-nums">{finance.procurementBaselines.worksContractWeeksTarget} أسبوعاً</strong>؛
                  و{" "}
                  <strong className="tabular-nums">{finance.procurementBaselines.consultancyWeeksBaseline} أسبوعاً</strong>{" "}
                  للاستشارات مقابل{" "}
                  <strong className="tabular-nums">{finance.procurementBaselines.consultancyWeeksTarget}</strong>.
                </p>
              </div>
            </section>
          </SeeMore>

          {/* Adjacent flows, folded */}
          <SeeMore locale="ar" label="مسارات المال الموازية خارج تمويل إعادة الإعمار">
            <section aria-labelledby="ar-adjacent" className="card">
              <h3
                id="ar-adjacent"
                className="text-h3 font-semibold text-navy"
              >
                مال تحرّك على مسارات موازية - وليس تمويل إعادة إعمار
              </h3>
              <p className="mt-1 max-w-3xl text-body text-text-secondary">
                هذه تدفّقات مال حقيقي لأغراض أخرى، ولا يجوز خلطها ببرنامج إعادة الإعمار.
              </p>
              <ul className="mt-4 space-y-2.5">
                {finance.adjacentFlows.map((f) => (
                  <li key={f.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-2.5 text-body last:border-b-0">
                    <span>
                      <span className="font-medium">{f.labelAr}.</span>{" "}
                      <span className="text-text-secondary">{f.noteAr}</span>
                    </span>
                    <span className="tabular-nums font-semibold text-navy">
                      {"displayAr" in f && f.displayAr ? f.displayAr : fmtUsd(f.amountUsd, "ar")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </SeeMore>

          {/* Compensation tracks */}
          <div className="mt-7">
            <CompensationTracks locale="ar" />
          </div>

          {/* Timeline */}
          <div className="mt-7">
            <DeliveryTimeline locale="ar" />
          </div>

          {/* Speed of functions */}
          <div className="mt-7">
            <FunctionSpeedChart locale="ar" />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Finding 3: a sound plan, an inadequate response               */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-plan">
          <FindingHeading index={3} id="finding-plan" title={plan.title} />
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {plan.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {plan.body[1]}
          </p>
          <SeeMore locale="ar" label="بنيتا القيادة في السنتين، جنباً إلى جنب">
            <InstitutionalStructures locale="ar" />
            <div className="mt-8">
              <ThreeStreams locale="ar" />
            </div>
          </SeeMore>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Finding 4: the community share. This finding reads the actor  */}
        {/* groups against each other, so it carries no counts anywhere:  */}
        {/* the wording ranks, the figures live nowhere.                  */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-community">
          <FindingHeading
            index={4}
            id="finding-community"
            title={community.title}
          />
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {community.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {community.body[1]}
          </p>
          <Onward locale="ar" href="/ar/actors?layer=community">
            مجموعة المجتمع المحلي في صفحة الجهات
          </Onward>
          <Onward locale="ar" href="/ar/reported">
            ما تُبلّغ عنه مبادرات الأهالي
          </Onward>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Finding 5: both responses stayed in the early stages          */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-stages">
          <FindingHeading index={5} id="finding-stages" title={stages.title} />
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {stages.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-loose text-text">
            {stages.body[1]}
          </p>
          <Onward locale="ar" href="/ar/actions#ar-action-mix">
            أي نوع من العمل رُصد، فئةً فئة
          </Onward>
        </section>
      </div>

      <div className="mt-16">
        <Takeaways
          locale="ar"
          changed="قِيست الحربان وأُطّرتا بشكل أفضل مع الوقت: قُيِّمت 2026 خلال أسابيع، في منتجات مشتركة مع مؤسسة علمية لبنانية يصرّح كل منها بحدوده، وبحلول 26 شباط 2026 صار إطار التمويل قنوات فعلية - قرض نافذ بقيمة 250 مليون دولار وحساب دفع وثلاث حزم شراء - ولم يكن أي من ذلك موجوداً في 2024."
          unchanged="التحويل. لا عدّ مرجعي واحد لأبنية أي من الحربين، والبقاع وبعلبك-الهرمل لم يُقيَّما أبداً في 2026، ولم يُدفع من القرض سوى 4.13 مليون دولار - أي 1.65% - حتى 29 حزيران 2026، ولم يُؤكَّد علناً أي إنجاز إعادة إعمار مكتمل عند آخر مراجعة."
          matters="البرامج تموّل ما يُقاس، فتدخل المناطق غير المقيَّمة أي أداة تمويل مقبلة متأخرةً وضعيفة. وإلى أن يظهر أول إرساء أشغال وأول دفعة تعويض حكومية وأول إنجاز مؤكَّد، يبقى عنوان الإطار وصفاً لقدرة، لا لتعافٍ - والأسر تعيش عند قاع القمع."
        />
      </div>
    </ArabicPageShell>
  );
}
