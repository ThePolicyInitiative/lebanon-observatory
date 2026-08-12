import type { Kpi } from "@/lib/types";

const KIND_STYLE: Record<Kpi["kind"], { label: string; cls: string }> = {
  need: { label: "Assessed need", cls: "bg-[#EEF2F7] text-[color:var(--color-navy)]" },
  framework: { label: "Framework", cls: "bg-[#E8F1F3] text-[color:var(--color-teal)]" },
  commitment: { label: "Commitment", cls: "bg-[#E8F1F3] text-[color:var(--color-teal)]" },
  disbursement: { label: "Disbursement", cls: "bg-[#FAF3E3] text-[#8a6200]" },
  output: { label: "Output", cls: "bg-[#F4EAF0] text-[color:var(--color-magenta)]" },
};

export default function KpiCard({ kpi }: { kpi: Kpi }) {
  const kind = KIND_STYLE[kpi.kind];
  return (
    <article className="flex flex-col rounded-md border border-[color:var(--color-border)] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_18px_rgba(23,59,99,0.09)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-medium leading-snug text-[color:var(--color-text-secondary)]">
          {kpi.label}
        </h3>
        <span
          className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${kind.cls}`}
        >
          {kind.label}
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-[color:var(--color-navy)]">
        {kpi.display}
      </p>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        {kpi.definition}
      </p>
      <dl className="mt-3 space-y-0.5 text-[11px] text-[color:var(--color-text-secondary)]">
        <div className="flex gap-1">
          <dt className="font-semibold">Reference:</dt>
          <dd>{kpi.referencePeriod}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-semibold">Scope:</dt>
          <dd>{kpi.geographicScope}</dd>
        </div>
      </dl>
    </article>
  );
}
