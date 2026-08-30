import type { Metadata } from "next";
import { AR, localeAlternates } from "@/lib/i18n";
import { finance } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";
import FinanceFunnel from "@/components/charts/FinanceFunnel";
import DeliveryTimeline from "@/components/charts/DeliveryTimeline";
import FunctionSpeedChart from "@/components/charts/FunctionSpeedChart";
import DisbursementWaffle from "@/components/charts/DisbursementWaffle";
import LeapComponentsChart from "@/components/charts/LeapComponentsChart";
import MilestoneGantt from "@/components/charts/MilestoneGantt";
import LeapResultsBoard from "@/components/LeapResultsBoard";
import CompensationTracks from "@/components/CompensationTracks";
import Takeaways from "@/components/Takeaways";
import { fmtUsd, fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: AR.pages.money.title,
  description: AR.pages.money.desc,
  alternates: localeAlternates("/money", "ar"),
};

/** The six concepts public debate merges, kept apart here as on the English page. */
const CONCEPTS = [
  {
    n: 1,
    label: "الاحتياج المقدَّر",
    text: "11 مليار دولار لحرب 2023-24 بحسب تقييم RDNA. والاحتياج ليس خطة وليس مالاً.",
  },
  {
    n: 2,
    label: "إطار التمويل",
    text: "إطار LEAP القابل للتوسّع بمليار دولار - ظرف يمكن أن يتدفّق إليه التمويل، بقي ثلاثة أرباعه فارغاً حتى تاريخ التوقف.",
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
    text: "ثلاث حزم خدمات استشارية نُشرت بين شباط وأيار 2026؛ ولم يُعرض إرساء أي منها عند مراجعة البوابة في 17 تموز.",
  },
  {
    n: 6,
    label: "الإنجاز المكتمل",
    text: "لا إنجاز إعادة إعمار مكتمل ومُعلَن، ولا عقد أشغال مُرسى، ولا دفعة تعويض حكومية مؤكَّدة حتى 31 تموز 2026.",
  },
];

/** The check date is in the section's opening line; the cards need only the status. */
const PORTAL_STATUS_AR: Record<string, string> = {
  "Under evaluation": "قيد التقييم",
  "No award displayed": "لا إرساء معروض",
};

export default function Page() {
  return (
    <ArabicPageShell
      title={AR.pages.money.title}
      lede={AR.pages.money.lede}
      point={AR.pages.money.point}
      englishHref="/money"
      figures={[
        { value: "11 مليار $", label: "احتياجات التعافي وإعادة الإعمار المقدَّرة" },
        { value: "1 مليار $", label: "إطار LEAP القابل للتوسّع" },
        { value: "250 مليون $", label: "القرض الأولي المُقرّ" },
        { value: "1.65%", label: "ما دُفع فعلياً من القرض الأولي" },
      ]}
    >
      {/* Six concepts */}
      <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONCEPTS.map((c) => (
          <li key={c.n} className="card">
            <p className="text-xs font-bold uppercase tracking-widest text-teal">
              {c.n}. {c.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{c.text}</p>
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
        <LeapResultsBoard locale="ar" />
      </div>

      {/* LEAP components, in full */}
      <section aria-labelledby="ar-leap" className="mt-7 card">
        <h2
          id="ar-leap"
          className="text-xl font-semibold text-navy"
        >
          داخل الـ250 مليون دولار الأولى
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          مخصّصات التقييم. أشغال إعادة الإعمار لم تُخصَّص لها مبالغ أولية عن قصد -
          فالأشغال تحتاج تحضيراً أولاً - وهو ما يترك فجوة الـ750 مليون دولار في
          الإطار للشركاء.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm tabular-nums">
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
                      <span className="block text-[11px] text-text-secondary">{c.noteAr}</span>
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

      {/* Procurement packages */}
      <section aria-labelledby="ar-procurement" className="mt-7">
        <h2
          id="ar-procurement"
          className="text-xl font-semibold text-navy"
        >
          حزم الشراء وحالتها الفعلية
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          الحالات كما كانت معروضة على بوابة الشراء في مجلس الإنماء والإعمار عند
          المراجعة في 17 تموز 2026. التمديدات وفترات التقييم أمر عادي بقواعد البنك
          الدولي، وغير عادي أمام الاحتياج اللبناني. وأحدّ إشارة هنا انعكاسية: جهة
          الرقابة من طرف ثالث اصطفّت في المسار البطيء نفسه الذي وُجدت لمراقبته.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {finance.procurementPackages.map((p) => (
            <article key={p.id} className="card">
              <h3 className="text-sm font-semibold leading-snug text-navy">
                {p.labelAr}
              </h3>
              <dl className="mt-2 space-y-1 text-xs text-text-secondary">
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
              <p className="mt-2 inline-block rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[11px] font-semibold text-[#8a6200]">
                {PORTAL_STATUS_AR[p.statusAtCheck] ?? p.statusAtCheck}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-4 card text-sm">
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

      {/* Adjacent flows */}
      <section aria-labelledby="ar-adjacent" className="mt-7 card">
        <h2
          id="ar-adjacent"
          className="text-xl font-semibold text-navy"
        >
          مال تحرّك على مسارات موازية - وليس تمويل إعادة إعمار
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-text-secondary">
          هذه تدفّقات مال حقيقي لأغراض أخرى، ولا يجوز خلطها ببرنامج إعادة الإعمار.
        </p>
        <ul className="mt-4 space-y-2.5">
          {finance.adjacentFlows.map((f) => (
            <li key={f.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-2.5 text-sm last:border-b-0">
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

      {/* Core statement */}
      <section className="mt-7 rounded-md border-s-4 border-navy bg-white p-6">
        <blockquote className="editorial-quote max-w-4xl text-lg leading-relaxed text-navy">
          تقدّمت البنية المؤسسية أسرع من المال ومن الإنجاز المادي. والشراء الجاري
          محطة إجرائية، لا معطى عن إعادة إعمار مكتملة.
        </blockquote>
      </section>

      <div className="mt-8">
        <Takeaways
          locale="ar"
          changed="حصل لبنان على أداة تمويل - حساب وقواعد ومسار يمكن أن يتدفّق إليه مال إضافي - حيث لم يكن في 2024 سوى رقم وأمل. والتحوّلات السياسية في 2025 تحرّكت بسرعة مؤسسية حالما وُجدت حكومة كاملة."
          unchanged="المقام: حتى لو مُوّل الإطار بالكامل فهو يعالج نحو الثلث العام من حرب واحدة. أما الثلثان الخاصان من الاحتياجات وحرب 2026 بكاملها فبقيا بلا أي أداة تمويل، وبقي الإنجاز المكتمل المؤكَّد عند الصفر."
          matters="كل ضمانة تحمي المال تُبطئه، والأسر لا تعيش سوى قاع القمع. ومصداقية التمويل صارت متوقفة على تحوّل مرئي - أول إرساء أشغال، وأول دفعة تعويض، وأول إنجاز مؤكَّد - وكل منها محدَّد وله صاحب ويمكن مراجعته."
        />
      </div>
    </ArabicPageShell>
  );
}
