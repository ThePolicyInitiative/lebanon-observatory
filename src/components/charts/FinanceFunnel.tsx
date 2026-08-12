import { financeFunnel } from "@/lib/data-client";
import { fmtUsd, fmtDate } from "@/lib/format";

/**
 * Visual 9 - Financing coverage. Nested horizontal bars comparing assessed
 * need, framework, initial loan and disbursement, plus a magnified
 * initial-loan disbursement view. Deliberately not a pie chart: nested
 * bars keep the scale honest and print every value.
 */
export default function FinanceFunnel() {
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
      className="card p-4 sm:p-5"
    >
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          From assessed need to verified output: the financing funnel
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Bars are drawn to a common linear scale - the near-invisibility of the
          lower bars is the finding, and every value is printed.
        </p>
      </figcaption>

      {(
        <>
          <div className="mt-4 space-y-4" role="img" aria-label="Nested bars: assessed need US$11 billion (100%); LEAP framework US$1 billion (9.09% of need); initial loan US$250 million (2.27% of need); disbursed US$4.13 million (about 0.04% of need). Works contracts awarded and verified completed output: zero as of the cut-off.">
            {bars.map((b) => {
              const pct = (b.amountUsd / max) * 100;
              return (
                <div key={b.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[13px] font-medium text-[color:var(--color-text)]">
                      {b.label}
                    </span>
                    <span className="text-[13px] tabular-nums text-[color:var(--color-text-secondary)]">
                      <strong className="text-[color:var(--color-navy)]">
                        {fmtUsd(b.amountUsd)}
                      </strong>
                      {typeof b.pctOfNeed === "number"
                        ? ` · ${b.pctOfNeed < 0.1 ? "≈0.04" : b.pctOfNeed}% of assessed need`
                        : ""}
                      {b.date ? ` · ${fmtDate(b.date)}` : ""}
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
              Magnified: disbursement against the initial US$250 million loan
            </h4>
            <div
              className="mt-3 flex h-7 w-full overflow-hidden rounded-sm"
              role="img"
              aria-label="Magnified bar: 1.65 percent of the initial loan disbursed, 98.35 percent not yet disbursed, as of 29 June 2026"
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
                  className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--color-amber)]"
                />
                Disbursed: <strong>1.65%</strong> (US$4.13M by 29 Jun 2026)
              </span>
              <span>
                <span
                  aria-hidden
                  className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#E8ECF1]"
                />
                Not yet disbursed: <strong>98.35%</strong>
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
                  {z.label}:
                </span>
                <span className="text-[color:var(--color-text-secondary)]">
                  {z.note} <em>(Not verified)</em>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-3 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        The US$1 billion framework is not equivalent to the US$11 billion
        national need: even fully funded it covers roughly the public third of
        one war&apos;s assessed needs. Committed finance is not disbursed
        finance; disbursement is not completed output.
      </p>
    </figure>
  );
}
