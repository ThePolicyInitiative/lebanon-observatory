import type { Kpi } from "@/lib/types";
import type { Locale } from "@/lib/vocab";

/**
 * The Arabic text lives beside the English in kpis.json; the fields are
 * optional in the schema, so the card falls back to English rather than
 * rendering a hole if one is ever missing.
 */
type KpiWithAr = Kpi & {
  labelAr?: string;
  definitionAr?: string;
  referencePeriodAr?: string;
  geographicScopeAr?: string;
};

const KIND_STYLE: Record<Kpi["kind"], { en: string; ar: string; cls: string }> = {
  need: { en: "Assessed need", ar: "احتياج مقدَّر", cls: "bg-[#EEF2F7] text-navy" },
  framework: { en: "Framework", ar: "إطار", cls: "bg-[#E8F1F3] text-teal" },
  commitment: { en: "Commitment", ar: "التزام", cls: "bg-[#E8F1F3] text-teal" },
  disbursement: { en: "Disbursement", ar: "دفع فعلي", cls: "bg-[#FAF3E3] text-[#8a6200]" },
  output: { en: "Output", ar: "مخرجات", cls: "bg-[#F4EAF0] text-magenta" },
};

const T = {
  en: { reference: "Reference:", scope: "Scope:" },
  ar: { reference: "الفترة المرجعية:", scope: "النطاق:" },
} as const;

export default function KpiCard({
  kpi,
  locale = "en",
}: {
  kpi: KpiWithAr;
  locale?: Locale;
}) {
  const kind = KIND_STYLE[kpi.kind];
  const ar = locale === "ar";
  const t = T[locale];
  return (
    <article className="card card-interactive flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-[12.5px] font-medium leading-snug text-text-secondary">
          {ar ? kpi.labelAr ?? kpi.label : kpi.label}
        </h3>
        <span className={`chip shrink-0 uppercase ${kind.cls}`}>
          {ar ? kind.ar : kind.en}
        </span>
      </div>
      <p className="figure-number mt-2 text-[26px] leading-none text-navy">
        {ar ? kpi.displayAr : kpi.display}
      </p>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-text-secondary">
        {ar ? kpi.definitionAr ?? kpi.definition : kpi.definition}
      </p>
      {/* Secondary, not muted: at 11px the muted grey sits under 3.5:1. */}
      <dl className="mt-3 space-y-0.5 border-t border-border pt-2 text-[11px] text-text-secondary">
        <div className="flex gap-1">
          <dt className="font-semibold">{t.reference}</dt>
          <dd>{ar ? kpi.referencePeriodAr ?? kpi.referencePeriod : kpi.referencePeriod}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-semibold">{t.scope}</dt>
          <dd>{ar ? kpi.geographicScopeAr ?? kpi.geographicScope : kpi.geographicScope}</dd>
        </div>
      </dl>
    </article>
  );
}
