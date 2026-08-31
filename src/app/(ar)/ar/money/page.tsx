import type { Metadata } from "next";
import Link from "next/link";
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
import SeeMore from "@/components/SeeMore";
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
    text: "إطار LEAP القابل للتوسّع بمليار دولار - ظرف يمكن أن يتدفّق إليه التمويل، بقي ثلاثة أرباعه فارغاً حتى 31 آب 2026.",
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
    text: "لا إنجاز إعادة إعمار مكتمل ومُعلَن، ولا عقد أشغال مُرسى، ولا دفعة تعويض حكومية مؤكَّدة حتى 31 آب 2026.",
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
      lede={
        <>
          العمق خلف خلاصتين من{" "}
          <Link
            href="/ar#findings"
            className="font-medium text-blue underline-offset-2 hover:underline"
          >
            خلاصات التقرير
          </Link>
          : مرجع الاحتياجات البالغ 11 مليار دولار، وخلاصة أن أطر التمويل
          المعلنة لم تكن مالاً في اليد. تُبقي هذه الصفحة ستة مفاهيم منفصلة -
          الاحتياج والإطار والإقرار والدفع والشراء والإنجاز المكتمل - لأن
          دمجها هو ما يجعل عبارتَي «إعادة الإعمار جارية» و«إعادة الإعمار لم
          تبدأ» تُقالان بصدق معاً.
        </>
      }
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
            <p className="text-micro font-bold uppercase tracking-widest text-teal">
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
          <h2
            id="ar-leap"
            className="text-h2 font-semibold text-navy"
          >
            داخل الـ250 مليون دولار الأولى
          </h2>
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
          <h2
            id="ar-procurement"
            className="text-h2 font-semibold text-navy"
          >
            حزم الشراء وحالتها الفعلية
          </h2>
          <p className="mt-1 max-w-3xl text-body text-text-secondary">
            الحالات كما كانت معروضة على بوابة الشراء في مجلس الإنماء والإعمار عند
            المراجعة في 17 تموز 2026. التمديدات وفترات التقييم أمر عادي بقواعد البنك
            الدولي، وغير عادي أمام الاحتياج اللبناني. وأحدّ إشارة هنا انعكاسية: جهة
            الرقابة من طرف ثالث اصطفّت في المسار البطيء نفسه الذي وُجدت لمراقبته.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {finance.procurementPackages.map((p) => (
              <article key={p.id} className="card">
                <h3 className="text-body font-semibold leading-snug text-navy">
                  {p.labelAr}
                </h3>
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
          <h2
            id="ar-adjacent"
            className="text-h2 font-semibold text-navy"
          >
            مال تحرّك على مسارات موازية - وليس تمويل إعادة إعمار
          </h2>
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

      <div className="mt-8">
        <Takeaways
          locale="ar"
          changed="بحلول 26 شباط 2026 صار الإطار قنوات فعلية: قرض نافذ بقيمة 250 مليون دولار، وحساب دفع، وثلاث حزم شراء قيد الحركة - ولم يكن أي من ذلك موجوداً في 2024، حين كان للاستجابة تقييم بـ11 مليار دولار وبلا أداة خلفه."
          unchanged="التحويل. حتى 29 حزيران 2026 لم يُدفع من القرض سوى 4.13 مليون دولار - أي 1.65% - ولم يُعرض إرساء أي عقد أشغال عند مراجعة البوابة، ولم يُؤكَّد علناً أي إنجاز إعادة إعمار مكتمل حتى 31 آب 2026."
          matters="الفجوة التي تقيسها هذه الصفحة تمتد بين سرعة الورق وسرعة المال. وإلى أن يظهر أول إرساء أشغال وأول دفعة تعويض حكومية وأول إنجاز مؤكَّد، يبقى رقم المليار دولار في عنوان الإطار وصفاً لقدرة، لا لتعافٍ - والأسر تعيش عند قاع القمع."
        />
      </div>
    </ArabicPageShell>
  );
}
