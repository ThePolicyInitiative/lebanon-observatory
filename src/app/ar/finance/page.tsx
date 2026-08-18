import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import finance from "@/data/finance.json";
import leapResults from "@/data/leap-results.json";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import { fmtUsd } from "@/lib/format";

export const metadata: Metadata = { title: AR.pages.finance.title };

const STATUS_AR: Record<string, string> = {
  zero: "صفر",
  process: "إجرائي",
  missed: "فات موعده",
  baseline: "خط أساس",
};

const STATUS_CLS: Record<string, string> = {
  zero: "bg-[#F7E9E5] text-[color:var(--color-rust)]",
  process: "bg-[#EEF2F7] text-[color:var(--color-navy)]",
  missed: "bg-[#FAF3E3] text-[#8a6200]",
  baseline: "bg-[#F2F2EF] text-[color:var(--color-text-secondary)]",
};

const PORTAL_STATUS_AR: Record<string, string> = {
  "Under evaluation (17 Jul 2026 portal check)":
    "قيد التقييم (مراجعة البوابة في 17 تموز 2026)",
  "No award displayed (17 Jul 2026 portal check)":
    "لا إرساء معروض (مراجعة البوابة في 17 تموز 2026)",
};

export default function Page() {
  const need = finance.funnel[0].amountUsd;
  return (
    <ArabicPageShell
      title={AR.pages.finance.title}
      lede={AR.pages.finance.lede}
      point={AR.pages.finance.point}
      englishHref="/finance"
      figures={[
        { value: "11 مليار $", label: "احتياجات التعافي وإعادة الإعمار المقدَّرة" },
        { value: "1 مليار $", label: "إطار LEAP القابل للتوسّع" },
        { value: "250 مليون $", label: "القرض الأولي المُقرّ" },
        { value: "1.65%", label: "ما دُفع فعلياً من القرض الأولي" },
      ]}
    >
      {/* The funnel, step by step */}
      <section aria-labelledby="ar-funnel" className="mt-10">
        <h2 id="ar-funnel" className="text-xl font-semibold text-[color:var(--color-navy)]">
          من الاحتياج المقدَّر إلى الإنجاز المؤكَّد
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          كل قيمة مرصودة عند خطوتها من التسلسل. التمويل الملتزَم به ليس تمويلاً
          مدفوعاً، والدفع ليس إنجازاً مكتملاً، والشراء الجاري محطة إجرائية لا دليلاً
          على إعادة إعمار.
        </p>
        <ul className="mt-5 space-y-2">
          {finance.funnel.map((s) => {
            const share = need ? (s.amountUsd / need) * 100 : 0;
            return (
              <li key={s.id} className="card p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[color:var(--color-navy)]">
                    {s.labelAr}
                  </span>
                  <span className="figure-number text-base text-[color:var(--color-navy)]">
                    {fmtUsd(s.amountUsd)}
                  </span>
                </div>
                <div
                  aria-hidden
                  className="mt-2 h-2.5 rounded-sm bg-[#EEF2F7]"
                  title={`${share.toFixed(2)}%`}
                >
                  <div
                    className="h-2.5 rounded-sm bg-[color:var(--color-navy)]"
                    style={{ width: `${Math.max(share, share > 0 ? 0.4 : 0)}%`, opacity: 0.85 }}
                  />
                </div>
                <p className="mt-1 text-[11px] tabular-nums text-[color:var(--color-text-secondary)]">
                  {share >= 0.01 ? `${share.toFixed(2)}%` : "0%"} من الاحتياج المقدَّر
                </p>
                {s.noteAr ? (
                  <p className="note-caution mt-2 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
                    {s.noteAr}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 max-w-3xl note-caution text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          الأشرطة مرسومة على مقياس خطي واحد - وضآلة الأشرطة السفلية هي الخلاصة نفسها،
          ولذلك تُطبع كل قيمة بالأرقام.
        </p>
      </section>

      {/* LEAP components */}
      <section aria-labelledby="ar-leap" className="mt-10">
        <h2 id="ar-leap" className="text-xl font-semibold text-[color:var(--color-navy)]">
          مكوّنات مشروع LEAP
        </h2>
        <ul className="mt-4 space-y-1.5">
          {finance.leapComponents.map((c) => {
            const max = Math.max(...finance.leapComponents.map((x) => x.appraisedUsd));
            return (
              <li key={c.label} className="flex items-center gap-2 text-[12.5px]">
                <span className="w-64 shrink-0 leading-snug">{c.labelAr}</span>
                <span
                  aria-hidden
                  className="h-2.5 rounded-sm bg-[color:var(--color-teal)]"
                  style={{ width: `${Math.max(3, (c.appraisedUsd / max) * 45)}%`, opacity: 0.8 }}
                />
                <span className="tabular-nums font-semibold">{fmtUsd(c.appraisedUsd)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          القيم هي المبالغ المقدَّرة عند التقييم. المبالغ الأولية أصغر، وهي في الصفحة
          الإنجليزية.
        </p>
      </section>

      {/* The results board */}
      <section aria-labelledby="ar-results" className="mt-10">
        <h2 id="ar-results" className="text-xl font-semibold text-[color:var(--color-navy)]">
          لوحة نتائج LEAP حتى {leapResults.asOf}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          مؤشرات المشروع المعلنة، كل منها بهدفه وموعده ونتيجته المسجّلة.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[640px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-[color:var(--color-border)] text-right">
                <th scope="col" className="py-2 pe-3 font-semibold text-[color:var(--color-navy)]">
                  المؤشر
                </th>
                <th scope="col" className="py-2 pe-3 font-semibold text-[color:var(--color-navy)]">
                  الهدف
                </th>
                <th scope="col" className="py-2 pe-3 font-semibold text-[color:var(--color-navy)]">
                  الموعد
                </th>
                <th scope="col" className="py-2 font-semibold text-[color:var(--color-navy)]">
                  النتيجة
                </th>
              </tr>
            </thead>
            <tbody>
              {leapResults.indicators.map((r) => (
                <tr key={r.indicator} className="border-b border-[#EDF0F4]">
                  <td className="py-2 pe-3 leading-snug">{r.indicator}</td>
                  <td className="py-2 pe-3 tabular-nums">{r.target}</td>
                  <td className="py-2 pe-3 tabular-nums">{r.deadline}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[r.status] ?? ""}`}
                    >
                      {r.resultJune2026} · {STATUS_AR[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          أسماء المؤشرات كما وردت في تقرير حالة التنفيذ والنتائج، بالإنجليزية.
        </p>
      </section>

      {/* Procurement */}
      <section aria-labelledby="ar-procurement" className="mt-10">
        <h2 id="ar-procurement" className="text-xl font-semibold text-[color:var(--color-navy)]">
          الشراء: ما كان معروضاً على البوابة
        </h2>
        <ul className="mt-4 space-y-2">
          {finance.procurementPackages.map((p) => (
            <li key={p.id} className="card p-3.5">
              <p className="text-[13px] font-semibold text-[color:var(--color-navy)]">
                {p.labelAr}
              </p>
              <p className="mt-1 text-[11.5px] text-[color:var(--color-text-secondary)]">
                نُشرت {p.published} · الموعد النهائي {p.deadline}
              </p>
              <p className="mt-1 text-[11.5px] font-semibold text-[color:var(--color-rust)]">
                {PORTAL_STATUS_AR[p.statusAtCheck] ?? p.statusAtCheck}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 note-caution text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          هذه حزم خدمات استشارية، لا عقود أشغال. لم يُعرض أي عقد أشغال مُرسى حتى تاريخ
          التوقف.
        </p>
      </section>

      <div className="mt-10">
        <Takeaways
          locale="ar"
          changed="صار هناك إطار تمويلي وقرض مُقر وسلسلة شراء معلنة، وهو ما لم يوجد في 2024."
          unchanged="لم يتحوّل شيء من ذلك إلى عقد أشغال مُرسى ولا إلى إنجاز مادي معلن."
          matters="الالتزام ليس دفعاً، والدفع ليس بناءً. الخلط بين الثلاثة هو ما يجعل التقدّم يبدو أكبر مما هو."
        />
      </div>
    </ArabicPageShell>
  );
}
