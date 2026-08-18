"use client";

import YearControl, { type YearMode } from "@/components/YearControl";
import { useUrlState } from "@/lib/useUrlState";

type Dimension = {
  id: string;
  label: string;
  y2024: string;
  y2026: string;
  change: string;
  kind: "gain" | "partial" | "none" | "redirected";
};

const DIMENSIONS: Dimension[] = [
  {
    id: "authority",
    label: "Authority",
    y2024:
      "Dispersed by default: territorial bodies held damage claims by legacy, ministries held sectors by statute, and no institution held the whole.",
    y2026:
      "Consolidated inside a project perimeter - cabinet for policy, Public Works for execution leadership, CDR for implementation, World Bank rules - while the Council for the South, the Higher Relief Commission and the parallel track kept de facto authority outside it.",
    change: "Consolidated, selectively: a clear hierarchy inside the perimeter, the old answer outside it.",
    kind: "gain",
  },
  {
    id: "coordination",
    label: "Coordination",
    y2024:
      "Emergency layers worked as designed - the Government Emergency Committee, the DRM Unit and the operations room - but held information-and-convening authority, not budget-and-contract authority.",
    y2026:
      "The same machine, rehearsed: the emergency operations room activated within hours; MoSA's single humanitarian channel was formalised; a deliberate firewall separated the emergency chain from the project chain.",
    change: "Straightforwardly better at the same task; predicts nothing about reconstruction.",
    kind: "gain",
  },
  {
    id: "finance",
    label: "Finance",
    y2024:
      "Needs eventually quantified at US$11 billion, financed at zero. Humanitarian money only; reported parallel-track cash was the only compensation moving.",
    y2026:
      "Structured and small: US$250 million effective within a US$1 billion framework, 1.65% disbursed by 29 June, a US$750 million gap explicitly awaiting partners.",
    change: "From absent to structured-and-small; the binding constraint moved from 'no vehicle' to 'no passengers'.",
    kind: "partial",
  },
  {
    id: "assessment",
    label: "Assessment",
    y2024:
      "Four non-additive damage tracks, national scope, months of latency, internationally produced; a usable national baseline only in March 2025.",
    y2026:
      "Bounded products in weeks, jointly produced with a Lebanese scientific institution (CNRS-L), plus a real-time national database - but covering two zones, with the Bekaa and the North unassessed at the cut-off.",
    change: "The cleanest capability gain of any function; coverage was traded for speed.",
    kind: "gain",
  },
  {
    id: "procurement",
    label: "Procurement",
    y2024:
      "Traced public procurement consisted essentially of one rubble tender launched on 27 December under the general procurement law.",
    y2026:
      "A rule-bound multi-package pipeline: three consulting packages published, none awarded at the 17 July portal check; a 56-week baseline works-contract cycle against a 12-week target.",
    change: "Form transformed, throughput not yet: 2024's risk was capture without process, 2026's is process without output.",
    kind: "partial",
  },
  {
    id: "implementation",
    label: "Physical implementation",
    y2024:
      "Emergency logic only: roads patched, utilities re-strung locally, self-financed repair - no programme works existed.",
    y2026:
      "Still emergency logic: ministry campaigns without published quantities, municipal and volunteer clearance - programme works remained preparatory with zero awarded contracts.",
    change: "No material change in what was actually delivered; the delivery category 'reconstruction' stayed empty in both years.",
    kind: "none",
  },
  {
    id: "humanitarian",
    label: "Humanitarian delivery",
    y2024:
      "Shelter for nearly 190,000 people at peak; relief at scale; the system emptied within days of the ceasefire.",
    y2026:
      "Shelter for more than 136,000 at peak; relief at larger scale with faster registration; the same cycle ran further and faster.",
    change: "Proven competence, twice - and in both years the delivered output was humanitarian, not reconstructive.",
    kind: "gain",
  },
  {
    id: "municipal",
    label: "Municipal authority",
    y2024:
      "Sensors and shock absorbers: damage reporting, shelter hosting, local access - with zero traced roles in finance, procurement, direct reconstruction and oversight.",
    y2026:
      "Intake and certification nodes in longer chains - with zero traced roles in finance, procurement, direct reconstruction and oversight.",
    change: "The comparison's null result: no empowerment in either year, and thinner traced presence (19 → 12 entries).",
    kind: "none",
  },
  {
    id: "community",
    label: "Community substitution",
    y2024:
      "The largest traced presence in every downstream stage - clearing, repairing, financing recovery from savings, remittances and labour.",
    y2026:
      "Grew overall (145 → 172 entries) while rotating into relief, coordination and shelter and out of finance, rubble and physical reconstruction.",
    change: "Substitution changed currency, not size: the system consumed savings and labour in 2024, care capacity and volunteer time in 2026.",
    kind: "redirected",
  },
  {
    id: "oversight",
    label: "Oversight",
    y2024:
      "Residual: general controls with little public money to grip; civil-society analyses supplied much of the traced scrutiny.",
    y2026:
      "A project-perimeter accountability stack - portal, grievance address, disclosed results, planned third-party monitoring - mostly unexercised by the cut-off, with the monitoring agent itself in tender.",
    change: "Fiduciary accountability built; political accountability essentially untouched. Strongest oversight sits where the least money moved.",
    kind: "partial",
  },
  {
    id: "outputs",
    label: "Confirmed outputs",
    y2024:
      "No financed programme existed, so no programme outputs; restoration ran on emergency budgets and self-help, quantities unpublished.",
    y2026:
      "Zero awarded works contracts, zero publicly confirmed completed reconstruction outputs, zero confirmed state compensation payments by 31 July 2026.",
    change: "Empty in both years - the report's most uncomfortable finding, and the one the next reporting cycle can falsify.",
    kind: "none",
  },
];

const KIND_BADGE: Record<Dimension["kind"], { label: string; cls: string }> = {
  gain: { label: "Formalised / improved", cls: "bg-[#E8F1F3] text-[color:var(--color-teal)]" },
  partial: { label: "Built, not yet delivering", cls: "bg-[#FAF3E3] text-[#8a6200]" },
  none: { label: "No material change", cls: "bg-[#F7E9E5] text-[color:var(--color-rust)]" },
  redirected: { label: "Redirected", cls: "bg-[#F4EAF0] text-[color:var(--color-magenta)]" },
};

export default function ComparePanel() {
  const { get, set } = useUrlState({ view: "side" });
  const mode = (get("view") as YearMode) || "side";

  return (
    <div>
      <div className="sticky top-[52px] z-40 -mx-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <YearControl
          mode={mode}
          onChange={(m) => set("view", m)}
          idPrefix="compare"
        />
      </div>

      <div className="mt-6 space-y-4">
        {DIMENSIONS.map((d) => (
          <section
            key={d.id}
            aria-label={d.label}
            className="rounded-md border border-[color:var(--color-border)] bg-white"
          >
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] px-4 py-2.5">
              <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                {d.label}
              </h3>
              <span
                className={`rounded-sm px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${KIND_BADGE[d.kind].cls}`}
              >
                {KIND_BADGE[d.kind].label}
              </span>
            </header>
            <div
              className={`grid gap-0 ${
                mode === "side" || mode === "change" ? "md:grid-cols-2" : ""
              }`}
            >
              {(mode === "2024" || mode === "side" || mode === "change") && (
                <div className="border-b border-[color:var(--color-border)] p-4 md:border-b-0 md:border-r">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2024)]">
                    2024
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[color:var(--color-text)]">
                    {d.y2024}
                  </p>
                </div>
              )}
              {(mode === "2026" || mode === "side" || mode === "change") && (
                <div className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2026)]">
                    2026
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[color:var(--color-text)]">
                    {d.y2026}
                  </p>
                </div>
              )}
            </div>
            {mode === "change" ? (
              <p className="border-t border-dashed border-[color:var(--color-border)] px-4 py-3 text-[13px] leading-relaxed">
                <span className="font-semibold text-[color:var(--color-rust)]">
                  Change:{" "}
                </span>
                {d.change}
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
