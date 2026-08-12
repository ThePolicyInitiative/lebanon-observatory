import leapResults from "@/data/leap-results.json";
import { fmtDate } from "@/lib/format";

/**
 * Promises with dates: LEAP's results-framework targets against the
 * disclosed June 2026 results. Every target assumes full framework
 * financing; every zero is the disclosed figure, not an inference.
 */

const STATUS_META: Record<string, { label: string; cls: string }> = {
  zero: { label: "Result: zero", cls: "bg-[#F7E9E5] text-[color:var(--color-rust)]" },
  missed: { label: "Target date missed", cls: "bg-[#F7E9E5] text-[color:var(--color-rust)]" },
  process: { label: "In process", cls: "bg-[#FAF3E3] text-[#8a6200]" },
  baseline: { label: "Baseline unchanged", cls: "bg-[#EEF2F7] text-[color:var(--color-navy)]" },
};

export default function LeapResultsBoard() {
  return (
    <figure className="rounded-md border border-[color:var(--color-border)] bg-white p-4 transition-shadow duration-200 hover:shadow-[0_2px_14px_rgba(23,59,99,0.07)] sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          Promises with dates: LEAP targets versus disclosed results
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          The project&apos;s own results framework against the{" "}
          {fmtDate(leapResults.asOf)} disclosure. Targets assume full US$1
          billion framework financing.
        </p>
      </figcaption>
      <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
        {leapResults.indicators.map((row) => {
          const meta = STATUS_META[row.status] ?? STATUS_META.process;
          return (
            <li
              key={row.indicator}
              className="rounded-md border border-[color:var(--color-border)] bg-[#FAFBFC] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-[color:var(--color-navy)]">
                  {row.indicator}
                </p>
                <span
                  className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.cls}`}
                >
                  {meta.label}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[color:var(--color-text-secondary)]">
                <span className="font-semibold text-[color:var(--color-text)]">
                  Target:
                </span>{" "}
                {row.target}
                {row.deadline !== "-" ? ` (${row.deadline})` : ""}
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--color-text-secondary)]">
                <span className="font-semibold text-[color:var(--color-text)]">
                  June 2026:
                </span>{" "}
                {row.resultJune2026}
              </p>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 space-y-1.5">
        {leapResults.footnotes.map((f) => (
          <p
            key={f.slice(0, 24)}
            className="border-l-2 border-[color:var(--color-amber)] pl-3 text-xs leading-relaxed text-[color:var(--color-text-secondary)]"
          >
            {f}
          </p>
        ))}
      </div>
    </figure>
  );
}
