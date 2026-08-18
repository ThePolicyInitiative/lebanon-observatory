
type ShiftKind = "formalised" | "built_not_delivering" | "unchanged" | "redirected";

const KIND_META: Record<ShiftKind, { label: string; color: string; bg: string }> = {
  formalised: { label: "Formalised and functioning", color: "#1B8295", bg: "#E8F1F3" },
  built_not_delivering: {
    label: "Built, not yet matched by confirmed delivery",
    color: "#8a6200",
    bg: "#FAF3E3",
  },
  unchanged: { label: "No material change", color: "#BD5A46", bg: "#F7E9E5" },
  redirected: { label: "Redirected activity", color: "#A34F7C", bg: "#F4EAF0" },
};

const ROWS: {
  dimension: string;
  y2024: string;
  y2026: string;
  kind: ShiftKind;
  movement: string;
}[] = [
  {
    dimension: "Strategic direction",
    y2024:
      "Caretaker cabinet and emergency committee: convening and coordination authority without the ability to commit funds or launch a programme.",
    y2026:
      "Elected president, empowered cabinet and Prime Minister's Office guidance over a formal project structure, with prioritisation fixed by cabinet decision.",
    kind: "formalised",
    movement:
      "Gained: cabinet, PMO and Ministry of Public Works execution leadership. The political conversions that stalled in 2024 moved in months once a full government existed.",
  },
  {
    dimension: "Finance",
    y2024:
      "No financed reconstruction programme. Humanitarian funding and reported parallel-track cash were the only money moving; needs were quantified at US$11 billion and financed at zero.",
    y2026:
      "US$250 million effective within a US$1 billion framework; US$4.13 million (1.65%) disbursed by 29 June 2026; a compensation framework designed but with no confirmed payment.",
    kind: "built_not_delivering",
    movement:
      "Gained: the World Bank as rule-setter and funder; the Ministry of Finance as loan manager. Not transferred: any financing authority to municipalities; any funded instrument for private (housing) needs.",
  },
  {
    dimension: "Implementation",
    y2024:
      "Households, municipalities, volunteers and agencies performed works by substitution - self-financed repair, improvised clearance, projectised patches.",
    y2026:
      "CDR project unit staffed, framework agreements prepared, contractors designated as implementers - and zero works contracts awarded by the cut-off.",
    kind: "built_not_delivering",
    movement:
      "Transferred (on paper): physical works from community substitution to the CDR–contractor chain. The transfer was designed but unexercised: everything actually restored by mid-2026 was restored the 2024 way.",
  },
  {
    dimension: "Local government",
    y2024:
      "Frontline sensors and shock absorbers: damage reporting, shelter hosting, local access, volunteer marshalling - with collapsed revenues and no reconstruction mandate.",
    y2026:
      "Repositioned as intake, certification and interface nodes in longer chains - still without reconstruction budgets, contractor-selection power or oversight authority.",
    kind: "unchanged",
    movement:
      "Lost: breadth of improvised frontline roles (19 → 12 traced entries). Gained: procedural interfaces only. Municipal finance, reconstruction and oversight power: zero in both years.",
  },
  {
    dimension: "Accountability",
    y2024:
      "Residual oversight: general controls with little public money to grip; civil-society analysis supplied much of the traced scrutiny.",
    y2026:
      "A project-perimeter stack - published procurement portal, grievance address, disclosed results, planned third-party monitoring - mostly unexercised by the cut-off, with the TPMA itself still in tender.",
    kind: "built_not_delivering",
    movement:
      "Gained: fiduciary accountability inside the project perimeter. Unchanged: political accountability outside it - compensation, emergency spending and parallel cash remained undisclosed.",
  },
  {
    dimension: "Community role",
    y2024:
      "The largest traced presence in every downstream stage: finance substitution, rubble clearance, reconstruction, relief - funded by savings, remittances and labour.",
    y2026:
      "Expanded overall but redirected: relief (+35), coordination (+25) and shelter (+7) grew while finance (−11), rubble (−9) and reconstruction (−5) contracted.",
    kind: "redirected",
    movement:
      "Redirected: from physical-and-financial substitution to humanitarian and social-recovery absorption. Community actors continued to absorb pressure without acquiring public-works authority.",
  },
];

/**
 * Visual 1 - Institutional shift diagram: the structured 2024 → 2026
 * transition across six dimensions, marking gains, losses and transfers.
 */
export default function InstitutionalShiftDiagram() {
  return (
    <figure className="card p-4 sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          The institutional shift, 2024 → 2026
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Six system dimensions, with explicit gains, losses and transfers.
          Colour marks the kind of change; each row states it in words.
        </p>
      </figcaption>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
        {(Object.keys(KIND_META) as ShiftKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: KIND_META[k].color }}
            />
            {KIND_META[k].label}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {ROWS.map((row) => {
          const meta = KIND_META[row.kind];
          return (
            <section
              key={row.dimension}
              aria-label={row.dimension}
              className="rounded-md border border-[color:var(--color-border)]"
            >
              <header
                className="flex flex-wrap items-center justify-between gap-2 rounded-t-md px-3 py-2"
                style={{ background: meta.bg }}
              >
                <h4 className="text-sm font-semibold" style={{ color: meta.color }}>
                  {row.dimension}
                </h4>
                <span
                  className="rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: meta.color, borderColor: meta.color }}
                >
                  {meta.label}
                </span>
              </header>
              <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr]">
                <div className="p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2024)]">
                    2024
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-text)]">
                    {row.y2024}
                  </p>
                </div>
                <div
                  aria-hidden
                  className="hidden items-center px-1 text-xl text-[color:var(--color-text-secondary)] md:flex"
                >
                  →
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2026)]">
                    2026
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-text)]">
                    {row.y2026}
                  </p>
                </div>
              </div>
              <p className="border-t border-dashed border-[color:var(--color-border)] px-3 py-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                {row.movement}
              </p>
            </section>
          );
        })}
      </div>
    </figure>
  );
}
