import leapResults from "@/data/leap-results.json";
import { fmtDate } from "@/lib/format";
import type { Locale } from "@/lib/vocab";

/**
 * Promises with dates: LEAP's results-framework targets against the
 * disclosed June 2026 results. Every target assumes full framework
 * financing; every zero is the disclosed figure, not an inference.
 */

/**
 * Status carries as an edge colour, not a chip. A chip reading "Result:
 * zero" beside a row that already prints "June 2026: 0" said the same
 * thing twice, and the words were the site's, not the disclosure's.
 */
const STATUS_EDGE: Record<string, string> = {
  zero: "var(--color-rust)",
  missed: "var(--color-rust)",
  process: "#D69600",
  baseline: "#8FA1B5",
};

const T = {
  en: {
    title: "What LEAP promised by when - and what it has reported so far",
    sub: (d: string) =>
      `Each card is one indicator the project set for itself: the target, its deadline, and the figure the project disclosed on ${d}. Targets assume the full US$1 billion framework is financed. A rust edge marks a disclosed zero or a missed date; an amber edge marks a step still in process; grey is a baseline figure.`,
    target: "Target:",
    result: "June 2026:",
  },
  ar: {
    title: "ما وعد به LEAP وموعده - وما أعلنه حتى الآن",
    sub: (d: string) =>
      `كل بطاقة مؤشر واحد وضعه المشروع لنفسه: الهدف، وموعده، والرقم الذي أعلنه المشروع في ${d}. الأهداف تفترض تمويل الإطار الكامل البالغ مليار دولار. الحافة الصدئة تعني صفراً معلناً أو موعداً فات؛ والكهرمانية خطوة لا تزال قيد الإجراء؛ والرمادية رقم أساس.`,
    target: "الهدف:",
    result: "حزيران 2026:",
  },
} as const;

export default function LeapResultsBoard({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  const ar = locale === "ar";
  const footnotes = ar ? leapResults.footnotesAr : leapResults.footnotes;

  return (
    <figure className="card card-interactive p-4 sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          {tr.title}
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          {tr.sub(fmtDate(leapResults.asOf, locale))}
        </p>
      </figcaption>
      <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
        {leapResults.indicators.map((row) => {
          const deadline = ar ? row.deadlineAr : row.deadline;
          return (
            <li
              key={row.indicator}
              className="panel-sunken border-s-2 p-3"
              style={{ borderInlineStartColor: STATUS_EDGE[row.status] ?? "#8FA1B5" }}
            >
              <p className="text-[13px] font-semibold text-[color:var(--color-navy)]">
                {ar ? row.indicatorAr : row.indicator}
              </p>
              <p className="mt-1.5 text-xs text-[color:var(--color-text-secondary)]">
                <span className="font-semibold text-[color:var(--color-text)]">
                  {tr.target}
                </span>{" "}
                {ar ? row.targetAr : row.target}
                {deadline !== "-" ? ` (${deadline})` : ""}
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--color-text-secondary)]">
                <span className="font-semibold text-[color:var(--color-text)]">
                  {tr.result}
                </span>{" "}
                {ar ? row.resultJune2026Ar : row.resultJune2026}
              </p>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 space-y-1.5">
        {footnotes.map((f) => (
          <p
            key={f.slice(0, 24)}
            className="note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]"
          >
            {f}
          </p>
        ))}
      </div>
    </figure>
  );
}
