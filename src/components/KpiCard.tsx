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
    <article className="card card-interactive flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-[12.5px] font-medium leading-snug text-[color:var(--color-text-secondary)]">
          {kpi.label}
        </h3>
        <span className={`chip shrink-0 uppercase ${kind.cls}`}>{kind.label}</span>
      </div>
      <p className="figure-number mt-2 text-[26px] leading-none text-[color:var(--color-navy)]">
        {kpi.display}
      </p>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        {kpi.definition}
      </p>
      <dl className="mt-3 space-y-0.5 border-t border-[color:var(--color-border)] pt-2 text-[11px] text-[color:var(--color-text-muted)]">
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
