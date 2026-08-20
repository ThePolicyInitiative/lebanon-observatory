import leapResults from "@/data/leap-results.json";
import { fmtDate } from "@/lib/format";
import type { Locale } from "@/lib/vocab";

/**
 * Promises with dates: LEAP's results-framework targets against the
 * disclosed June 2026 results. Every target assumes full framework
 * financing; every zero is the disclosed figure, not an inference.
 */

const STATUS_META: Record<
  string,
  { label: string; labelAr: string; cls: string }
> = {
  zero: {
    label: "Result: zero",
    labelAr: "النتيجة: صفر",
    cls: "bg-[#F7E9E5] text-[color:var(--color-rust)]",
  },
  missed: {
    label: "Target date missed",
    labelAr: "فات الموعد المستهدف",
    cls: "bg-[#F7E9E5] text-[color:var(--color-rust)]",
  },
  process: {
    label: "In process",
    labelAr: "قيد الإجراء",
    cls: "bg-[#FAF3E3] text-[#8a6200]",
  },
  baseline: {
    label: "Baseline unchanged",
    labelAr: "خط الأساس بلا تغيير",
    cls: "bg-[#EEF2F7] text-[color:var(--color-navy)]",
  },
};

const T = {
  en: {
    title: "Promises with dates: LEAP targets versus disclosed results",
    sub: (d: string) =>
      `The project's own results framework against the ${d} disclosure. Targets assume full US$1 billion framework financing.`,
    target: "Target:",
    result: "June 2026:",
  },
  ar: {
    title: "وعود بمواعيد: أهداف LEAP مقابل النتائج المعلنة",
    sub: (d: string) =>
      `إطار نتائج المشروع نفسه مقابل ما أُعلن في ${d}. الأهداف تفترض تمويلاً كاملاً للإطار البالغ مليار دولار.`,
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
          const meta = STATUS_META[row.status] ?? STATUS_META.process;
          const deadline = ar ? row.deadlineAr : row.deadline;
          return (
            <li
              key={row.indicator}
              className="panel-sunken p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-[color:var(--color-navy)]">
                  {ar ? row.indicatorAr : row.indicator}
                </p>
                <span
                  className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.cls}`}
                >
                  {ar ? meta.labelAr : meta.label}
                </span>
              </div>
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
