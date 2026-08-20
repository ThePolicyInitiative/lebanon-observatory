import { financeFunnel } from "@/lib/data-client";
import { fmtUsd, fmtDate } from "@/lib/format";
import type { Locale } from "@/lib/vocab";

/**
 * Visual 9 - Financing coverage. Nested horizontal bars comparing assessed
 * need, framework, initial loan and disbursement, plus a magnified
 * initial-loan disbursement view. Deliberately not a pie chart: nested
 * bars keep the scale honest and print every value.
 */

const T = {
  en: {
    title: "From assessed need to confirmed output: the financing funnel",
    sub: "Bars are drawn to a common linear scale - the near-invisibility of the lower bars is the finding, and every value is printed.",
    ofNeed: "% of assessed need",
    magnified: "Magnified: disbursement against the initial US$250 million loan",
    disbursed: "Disbursed:",
    disbursedNote: "(US$4.13M by 29 Jun 2026)",
    notDisbursed: "Not yet disbursed:",
    caveat:
      "The US$1 billion framework is not equivalent to the US$11 billion national need: even fully funded it covers roughly the public third of one war's assessed needs. Committed finance is not disbursed finance; disbursement is not completed output.",
    barsAlt:
      "Nested bars: assessed need US$11 billion (100%); LEAP framework US$1 billion (9.09% of need); initial loan US$250 million (2.27% of need); disbursed US$4.13 million (about 0.04% of need). Works contracts awarded and confirmed completed output: zero as of the cut-off.",
    magnifiedAlt:
      "Magnified bar: 1.65 percent of the initial loan disbursed, 98.35 percent not yet disbursed, as of 29 June 2026",
  },
  ar: {
    title: "من الاحتياج المقدَّر إلى الإنجاز المؤكَّد: قمع التمويل",
    sub: "الأشرطة مرسومة على مقياس خطي واحد - وضآلة الأشرطة السفلية هي الخلاصة نفسها، ولذلك تُطبع كل قيمة بالأرقام.",
    ofNeed: "% من الاحتياج المقدَّر",
    magnified: "بتكبير: ما دُفع من القرض الأولي البالغ 250 مليون دولار",
    disbursed: "المدفوع:",
    disbursedNote: "(4.13 مليون دولار حتى 29 حزيران 2026)",
    notDisbursed: "غير المدفوع بعد:",
    caveat:
      "إطار المليار دولار لا يعادل الاحتياج الوطني البالغ 11 مليار دولار: حتى لو مُوّل بالكامل فهو يغطي نحو الثلث العام من احتياجات حرب واحدة. والتمويل الملتزَم به ليس تمويلاً مدفوعاً، والدفع ليس إنجازاً مكتملاً.",
    barsAlt:
      "أشرطة متداخلة: الاحتياج المقدَّر 11 مليار دولار (100%)؛ إطار LEAP مليار دولار (9.09% من الاحتياج)؛ القرض الأولي 250 مليون دولار (2.27%)؛ المدفوع 4.13 مليون دولار (نحو 0.04%). وعقود الأشغال المُرساة والإنجاز المكتمل المؤكَّد: صفر حتى تاريخ التوقف.",
    magnifiedAlt:
      "شريط مكبَّر: 1.65 في المئة من القرض الأولي مدفوعة، و98.35 في المئة غير مدفوعة بعد، حتى 29 حزيران 2026",
  },
} as const;

export default function FinanceFunnel({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  const bars = financeFunnel.filter((f) => f.amountUsd > 0);
  const max = Math.max(...bars.map((b) => b.amountUsd));
  const zeroRows = financeFunnel.filter((f) => f.amountUsd === 0);

  const barColor: Record<string, string> = {
    need: "#173B63",
    framework: "#2E74B5",
    approved: "#1B8295",
    disbursed: "#D69600",
  };

  return (
    <figure
      id="finance-funnel"
      className="card p-3.5 sm:p-4"
    >
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          {tr.title}
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          {tr.sub}
        </p>
      </figcaption>

      <div className="mt-4 space-y-4" role="img" aria-label={tr.barsAlt}>
        {bars.map((b) => {
          const pct = (b.amountUsd / max) * 100;
          return (
            <div key={b.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[13px] font-medium text-[color:var(--color-text)]">
                  {locale === "ar" ? b.labelAr : b.label}
                </span>
                <span className="text-[13px] tabular-nums text-[color:var(--color-text-secondary)]">
                  <strong className="text-[color:var(--color-navy)]">
                    {fmtUsd(b.amountUsd, locale)}
                  </strong>
                  {typeof b.pctOfNeed === "number"
                    ? ` · ${b.pctOfNeed < 0.1 ? "≈0.04" : b.pctOfNeed}${tr.ofNeed}`
                    : ""}
                  {b.date ? ` · ${fmtDate(b.date, locale)}` : ""}
                </span>
              </div>
              <div className="mt-1 h-5 w-full rounded-sm bg-[#F1F3F6]">
                <div
                  className="h-5 rounded-sm"
                  style={{
                    width: `max(${pct}%, 2px)`,
                    background: barColor[b.status] ?? "#667588",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 panel-sunken p-4">
        <h4 className="text-sm font-semibold text-[color:var(--color-navy)]">
          {tr.magnified}
        </h4>
        <div
          className="mt-3 flex h-7 w-full overflow-hidden rounded-sm"
          role="img"
          aria-label={tr.magnifiedAlt}
        >
          <div
            className="h-full bg-[color:var(--color-amber)]"
            style={{ width: "1.65%", minWidth: "3px" }}
          />
          <div className="h-full flex-1 bg-[#E8ECF1]" />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs tabular-nums text-[color:var(--color-text-secondary)]">
          <span>
            <span
              aria-hidden
              className="me-1 inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--color-amber)]"
            />
            {tr.disbursed} <strong>1.65%</strong> {tr.disbursedNote}
          </span>
          <span>
            <span
              aria-hidden
              className="me-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#E8ECF1]"
            />
            {tr.notDisbursed} <strong>98.35%</strong>
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {zeroRows.map((z) => (
          <li
            key={z.id}
            className="flex flex-wrap items-baseline gap-x-2 text-[13px]"
          >
            <span className="font-medium text-[color:var(--color-rust)]">
              {locale === "ar" ? z.labelAr : z.label}:
            </span>
            <span className="text-[color:var(--color-text-secondary)]">
              {locale === "ar" ? z.noteAr : z.note}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        {tr.caveat}
      </p>
    </figure>
  );
}
