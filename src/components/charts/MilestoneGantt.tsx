"use client";

import ChartFrame from "./ChartFrame";

/**
 * The road from cabinet request to 1.65% disbursed: elapsed days between
 * each LEAP milestone, drawn to scale.
 */
const MILESTONES: { date: string; label: string }[] = [
  { date: "2024-12-17", label: "Cabinet requests RDNA" },
  { date: "2025-06-24", label: "Board approves US$250M loan" },
  { date: "2025-08-25", label: "Loan agreement signed" },
  { date: "2025-12-19", label: "Parliamentary ratification" },
  { date: "2026-02-26", label: "LEAP effective" },
  { date: "2026-05-13", label: "First disbursement" },
  { date: "2026-06-29", label: "US$4.13M disbursed (1.65%)" },
];

const SEGMENT_COLORS = ["#58779B", "#6E8AA8", "#8496AF", "#9AA9BD", "#B0BCCB", "#BD5A46"];

function days(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export default function MilestoneGantt() {
  const segments = MILESTONES.slice(0, -1).map((m, i) => ({
    from: m,
    to: MILESTONES[i + 1],
    days: days(m.date, MILESTONES[i + 1].date),
  }));
  const totalDays = days(MILESTONES[0].date, MILESTONES[MILESTONES.length - 1].date);

  return (
    <ChartFrame
      id="milestone-gantt"
      title={`${totalDays} days from cabinet request to 1.65% disbursed`}
      subtitle="Elapsed time between each LEAP milestone, drawn to scale. Every institutional step - approval, signing, ratification, effectiveness - consumed months while destruction accumulated."
      caveat="Milestone dates from the verified timeline; the 2026 war began on 2 March 2026, four days after LEAP became effective. Elapsed time measures institutional sequence, not fault: each step has its own legal prerequisites."
      description={`Timeline segments: ${segments.map((s) => `${s.from.label} to ${s.to.label}: ${s.days} days`).join("; ")}. Total ${totalDays} days.`}
      table={{
        caption: "Elapsed days between LEAP milestones.",
        headers: ["From", "To", "Date reached", "Days elapsed"],
        rows: segments.map((s) => [s.from.label, s.to.label, s.to.date, s.days]),
      }}
    >
      <div>
        <div
          className="flex h-9 w-full overflow-hidden rounded-md"
          role="img"
          aria-label={`Proportional bar of ${totalDays} days across six milestone intervals`}
        >
          {segments.map((s, i) => (
            <div
              key={s.to.date}
              className="flex items-center justify-center text-[10px] font-semibold text-white"
              style={{
                width: `${(s.days / totalDays) * 100}%`,
                background: SEGMENT_COLORS[i],
              }}
              title={`${s.from.label} → ${s.to.label}: ${s.days} days`}
            >
              {s.days >= 40 ? `${s.days}d` : ""}
            </div>
          ))}
        </div>
        <ol className="mt-3 space-y-1 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
          {segments.map((s, i) => (
            <li key={s.to.date} className="flex items-baseline gap-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 translate-y-px rounded-[2px]"
                style={{ background: SEGMENT_COLORS[i] }}
              />
              <span>
                <strong className="text-[color:var(--color-navy)]">{s.days} days</strong>{" "}
                - {s.from.label} → {s.to.label}{" "}
                <span className="tabular-nums">({s.to.date})</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </ChartFrame>
  );
}
