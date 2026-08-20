"use client";

import { LAYER_META } from "@/lib/colors";
import { layerTotal } from "@/lib/data-client";
import { actors } from "@/lib/data-client";
import { useUrlState } from "@/lib/useUrlState";
import type { ActorLayer } from "@/lib/types";
import { signed } from "@/lib/format";
import MunicipalDumbbell from "@/components/charts/MunicipalDumbbell";
import DivergingChangeChart from "@/components/charts/DivergingChangeChart";
import LayerStageProfile from "@/components/charts/LayerStageProfile";
import RegionPresence from "@/components/charts/RegionPresence";
import ActorConcentration from "@/components/charts/ActorConcentration";

type TabContent = {
  profile2024: string;
  profile2026: string;
  directChange: string;
  gains: string[];
  losses: string[];
  mandateVsAction: string;
  financeRole: string;
  procurementRole: string;
  implementationRole: string;
  coreFinding?: string;
  sourceIds: string[];
};

const CONTENT: Record<ActorLayer, TabContent> = {
  official: {
    profile2024:
      "The 2024 state was strong exactly where mandates require least money and weak exactly where reconstruction happens: 24 of 54 traced actors in strategy and coordination and 11 of 37 in assessment, but only 4 of 8 in procurement, 2 of 12 in debris treatment and 3 of 8 in oversight. Every downstream function had a legal public owner; in practice its traced performers were private, communal or international.",
    profile2026:
      "The 2026 state concentrated in programmed reconstruction rather than expanding uniformly: steady in strategy (24 → 24), newly present in procurement and oversight cells that were thin or empty before, and thinner as an emergency-finance crowd - one financed project chain replaced fifteen scattered emergency-finance presences.",
    directChange:
      "Greater role specialisation rather than uniform state expansion: the official row changed least in total while changing most in kind.",
    gains: [
      "Reconstruction and services: 8 → 13 traced actors",
      "Procurement and contracting: 4 → 5",
      "Oversight and accountability: 3 → 4",
      "Strategy held steady at 24 - with an empowered executive behind it",
    ],
    losses: [
      "Finance and compensation: 15 → 7 (a project chain replaced an emergency-finance crowd)",
      "Shelter and return: 6 → 3 (humanitarian routing formalised through MoSA)",
      "Livelihoods presence: 4 → 1",
      "Relief presence held at 4 while the humanitarian load moved to partners",
    ],
    mandateVsAction:
      "In both years the state held a de jure owner for every stage. What changed was activation: 2024 mandates were claims on budget lines that a caretaker government with a collapsed treasury could not exercise beyond coordination; 2026 re-funded and re-traced a subset of the same mandates rather than inventing new ones.",
    financeRole:
      "Borrower and fiscal manager of the LEAP loan (Ministry of Finance); cabinet approved the January 2026 compensation framework - with no confirmed payment by the cut-off.",
    procurementRole:
      "CDR runs LEAP procurement under World Bank rules with a published portal; the Council for the South continued legacy tendering outside the project perimeter.",
    implementationRole:
      "Ministry of Public Works holds execution leadership; ministry campaigns and utilities performed emergency repair with unpublished quantities; programme works remained unawarded.",
    sourceIds: ["S-TRACKING", "S2", "S20", "S1", "S37"],
  },
  ngo_international: {
    profile2024:
      "International organisations supplied the response's data and much of its delivery capacity: dominant in assessment (13 of 37 traced actors), strong in humanitarian finance (12) and relief (11), and absent from procurement and oversight. Agencies substituted excellently for the state's operational functions and not at all for its political ones.",
    profile2026:
      "International involvement shifted from assessment and humanitarian support toward operational governance around the formal project, including procurement rules, disclosure, safeguards, supervision, grievance handling and third-party monitoring - first-ever traced presence in procurement and oversight cells.",
    directChange:
      "Traced breadth grew moderately while placement changed decisively: fewer assessment presences (the function partially repatriated to CNRS-L), more governance presences around the financed chain.",
    gains: [
      "Strategy and coordination: +8 (15 → 23)",
      "Shelter and return: +4 (7 → 11)",
      "Relief and protection: +5 (11 → 16)",
      "Oversight and accountability: +3 (0 → 3)",
      "Procurement and contracting: +1 (0 → 1)",
    ],
    losses: [
      "Damage and needs assessment: −7 (13 → 6) - a genuine capacity transfer to Lebanese institutions, not a withdrawal",
      "Finance presence: −2 (12 → 10), as humanitarian finance consolidated",
    ],
    mandateVsAction:
      "International actors do not hold Lebanese legal mandates; their authority in 2026 was contractual and procedural - the price of lendability. Eligibility criteria, procurement thresholds and results frameworks now shape what 'reconstruction' means in practice.",
    financeRole:
      "The World Bank became the reconstruction stream's rule-setter as well as funder; the humanitarian appeal (42% funded at 6 July) and bilateral packages ran on parallel tracks that must not be conflated with reconstruction financing.",
    procurementRole:
      "World Bank procurement law governs LEAP packages; the Third-Party Monitoring Agent - an external accountability actor - was itself under procurement at the cut-off.",
    implementationRole:
      "Agencies delivered relief, shelter support and WASH at scale in both years; they did not and could not resolve compensation policy, property rights or municipal finance.",
    sourceIds: ["S-TRACKING", "S2", "S40", "S5", "S6"],
  },
  municipal: {
    profile2024:
      "Municipalities were the system's sensors and shock absorbers, and its least resourced tier: they traced damage, ran or hosted shelters, reopened local access and marshalled volunteers - and the ten-day municipal survey of 135 areas produced the response's fastest national damage assessments. Yet the tracking shows 19 actor-stage entries with zero systematic roles in finance, direct reconstruction, livelihoods or oversight.",
    profile2026:
      "Municipalities were repositioned rather than empowered: from frontline improvisers to intake-and-certification nodes in longer chains. Their traced presence thinned to 12 entries, concentrated in reporting, shelter support and local clearance. Formal appearances in the new architecture are as data providers, certifiers, consultation subjects and grievance interfaces - never as budget holders, procurers or sequencers.",
    directChange:
      "Traced presence fell 19 → 12 with no compensating gain anywhere in the row. Formalisation moved authority up while leaving labour down: every new procedure that runs 'through' municipalities extracts work without conferring resources.",
    gains: ["Shelter and relief interface: 3 → 4 - the only functional gain"],
    losses: [
      "Coordination and reporting: 6 → 3",
      "Damage assessment: 4 → 2",
      "Local clearance and enabling: 6 → 3",
    ],
    mandateVsAction:
      "Municipalities held local knowledge, resident contact, damage-reporting and access-facilitation functions in both years - and in neither year did they hold reconstruction budgets, procurement authority, contractor-selection power or oversight authority. Procedural consultation is not decentralisation.",
    financeRole:
      "None traced in either year. Municipal revenues collapsed with the currency; no reconstruction budget line, guaranteed envelope or procurement support scheme was created between the wars.",
    procurementRole:
      "None traced in either year - with the exception of the Union of Municipalities of the Southern Suburbs, which ran a cabinet-assigned rubble tender in 2024 outside any standing municipal mandate.",
    implementationRole:
      "Reported clearance across sixteen-plus localities in 2026, shelter hosting through both displacement waves, utility liaison - labour without authority.",
    coreFinding:
      "Municipalities remained essential as frontline sensors, resident-contact points and access facilitators, but they did not receive proportional reconstruction budgets, contractor-selection power or oversight authority.",
    sourceIds: ["S-TRACKING", "S19", "S10", "S8"],
  },
  community: {
    profile2024:
      "The community bloc - residents, NGOs, professional bodies, volunteers and parallel networks, 145 of 343 entries - performed the functions of a reconstruction ministry with none of its resources: households cleared and repaired at their own expense, villages financed collective solutions, professionals contributed system inputs, and the parallel track distributed the only compensation actually flowing.",
    profile2026:
      "The bloc's entry grew to 172 entries and rotated: traced presence surged in coordination (9 → 34), relief (20 → 55) and shelter (18 → 25) while collapsing in finance (15 → 4), rubble (11 → 2), debris (7 → 2) and physical reconstruction (18 → 13). Its composition shifted from professional-technical to civic-operational - from supplying missing expertise to supplying missing labour.",
    directChange:
      "Community action expanded sharply in humanitarian and social-recovery functions but contracted in finance, rubble management and physical reconstruction. It absorbed pressure without acquiring public-works authority.",
    gains: [
      "Relief and protection: +35 (20 → 55)",
      "Strategy and coordination: +25 (9 → 34)",
      "Shelter and return: +7 (18 → 25)",
      "Livelihoods and community recovery: +1 (22 → 23)",
    ],
    losses: [
      "Finance and compensation: −11 (15 → 4) - household finance exhausted by a second displacement in eighteen months",
      "Rubble clearance: −9 (11 → 2)",
      "Debris treatment: −5 (7 → 2)",
      "Reconstruction and services: −5 (18 → 13)",
    ],
    mandateVsAction:
      "Community delivery does not imply formal authority, stable finance, equal geographic reach or public accountability. In both wars the bloc was the system's shock absorber; in 2026 it absorbed a social shock because the financial one had already spent it. Part of the traced surge also reflects finer-grained 2026 entries.",
    financeRole:
      "Contracted sharply: savings, remittances and diaspora finance were depleted; reported parallel-track cash appears in the 2026 entry as continued relevance rather than measured flows.",
    procurementRole:
      "None - physical work professionalised into contractor and ministry channels that the bloc does not control.",
    implementationRole:
      "Shelter management (one Saida school hosted about 650 families), volunteer clearance campaigns in Nabatieh, entries initiatives and participatory workshops - load-bearing functions a programmed system would staff and budget, performed unpaid.",
    coreFinding:
      "Community action expanded sharply in humanitarian and social-recovery functions but contracted in finance, rubble management and physical reconstruction. It absorbed pressure without acquiring public-works authority.",
    sourceIds: ["S-TRACKING", "S58", "S59", "S21", "S9"],
  },
};

function DeJureDeFacto({ layer }: { layer: ActorLayer }) {
  const entries = actors
    .filter((a) => a.layer === layer && a.deJureDeFacto)
    .sort((a, b) => a.year - b.year || b.recordCount - a.recordCount);
  if (entries.length === 0) return null;

  function split(text: string): { deJure: string | null; deFacto: string | null; raw: string } {
    const m = text.match(/de jure:?\s*([\s\S]*?)\s*de facto:?\s*([\s\S]*)/i);
    if (m) return { deJure: m[1], deFacto: m[2], raw: text };
    return { deJure: null, deFacto: null, raw: text };
  }

  return (
    <section className="card p-5">
      <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
        On paper versus in practice
      </h3>
      <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
        The traced entries, actor by actor, the gap between legal
        mandate and actual capacity - the de jure / de facto inversion that
        defines both years.
      </p>
      <ul className="mt-4 space-y-3">
        {entries.slice(0, 6).map((a) => {
          const s = split(a.deJureDeFacto!);
          return (
            <li key={a.id} className="rounded-md border border-[color:var(--color-border)] p-3.5">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[color:var(--color-navy)]">
                {a.name.split(":")[0]}
                <span
                  className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: a.year === 2024 ? "var(--color-y2024)" : "var(--color-y2026)" }}
                >
                  {a.year}
                </span>
              </p>
              {s.deJure ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <p className="rounded-sm bg-[#EEF2F7] p-2.5 text-[12.5px] leading-relaxed">
                    <span className="font-bold text-[color:var(--color-navy)]">De jure: </span>
                    {s.deJure}
                  </p>
                  <p className="rounded-sm bg-[#F7E9E5] p-2.5 text-[12.5px] leading-relaxed">
                    <span className="font-bold text-[color:var(--color-rust)]">De facto: </span>
                    {s.deFacto}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-[12.5px] leading-relaxed">{s.raw}</p>
              )}
            </li>
          );
        })}
      </ul>
      {entries.length > 6 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[color:var(--color-blue)] underline underline-offset-2">
            Show all {entries.length} actors with de jure / de facto notes
          </summary>
          <ul className="mt-3 space-y-3">
            {entries.slice(6).map((a) => {
              const s = split(a.deJureDeFacto!);
              return (
                <li key={a.id} className="rounded-md border border-[color:var(--color-border)] p-3.5">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[color:var(--color-navy)]">
                    {a.name.split(":")[0]}
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ background: a.year === 2024 ? "var(--color-y2024)" : "var(--color-y2026)" }}
                    >
                      {a.year}
                    </span>
                  </p>
                  {s.deJure ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <p className="rounded-sm bg-[#EEF2F7] p-2.5 text-[12.5px] leading-relaxed">
                        <span className="font-bold text-[color:var(--color-navy)]">De jure: </span>
                        {s.deJure}
                      </p>
                      <p className="rounded-sm bg-[#F7E9E5] p-2.5 text-[12.5px] leading-relaxed">
                        <span className="font-bold text-[color:var(--color-rust)]">De facto: </span>
                        {s.deFacto}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[12.5px] leading-relaxed">{s.raw}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </section>
  );
}



export default function ActorTabs() {
  const { get, set } = useUrlState({ layer: "official" });
  const layer = (get("layer") as ActorLayer) || "official";
  const content = CONTENT[layer];
  const meta = LAYER_META.find((l) => l.id === layer)!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Actor layers"
        className="sticky top-[var(--header-h)] z-40 -mx-4 flex flex-wrap gap-1 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6"
      >
        {LAYER_META.map((l) => {
          const active = l.id === layer;
          return (
            <button
              key={l.id}
              role="tab"
              aria-selected={active}
              aria-controls={`tabpanel-${l.id}`}
              id={`tab-${l.id}`}
              onClick={() => set("layer", l.id)}
              className={`min-h-11 rounded-t-md border-b-[3px] px-3.5 text-[13px] transition-colors duration-150 ${
                active
                  ? "font-semibold text-[color:var(--color-navy)]"
                  : "border-transparent text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-navy)]"
              }`}
              style={active ? { borderBottomColor: l.color } : undefined}
            >
              <span
                aria-hidden
                className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: l.color }}
              />
              {l.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${layer}`}
        aria-labelledby={`tab-${layer}`}
        className="mt-6 space-y-8"
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-xl font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </h2>
          <p className="text-sm tabular-nums text-[color:var(--color-text-secondary)]">
            Traced actor-stage presence: {layerTotal(2024, layer)} (2024) →{" "}
            {layerTotal(2026, layer)} (2026) ·{" "}
            {signed(layerTotal(2026, layer) - layerTotal(2024, layer))}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-md border-t-4 bg-white p-5" style={{ borderTopColor: "var(--color-y2024)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-y2024)]">
              2024 profile
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{content.profile2024}</p>
          </section>
          <section className="rounded-md border-t-4 bg-white p-5" style={{ borderTopColor: "var(--color-y2026)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-y2026)]">
              2026 profile
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{content.profile2026}</p>
          </section>
        </div>

        <section className="card p-5">
          <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
            Direct change
          </h3>
          <p className="mt-2 text-sm leading-relaxed">{content.directChange}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-teal)]">
                Main gains
              </h4>
              <ul className="mt-2 space-y-1.5 text-sm">
                {content.gains.map((g) => (
                  <li key={g} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-teal)]" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-rust)]">
                Main losses
              </h4>
              <ul className="mt-2 space-y-1.5 text-sm">
                {content.losses.map((l) => (
                  <li key={l} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-rust)]" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Every tab: the layer's own shape along the chain. The prose
            above describes it; this is the same claim, drawn. */}
        <LayerStageProfile layer={layer} showCaveat={false} />

        {layer === "municipal" ? <MunicipalDumbbell /> : null}
        {layer === "ngo_international" ? (
          <>
            <DivergingChangeChart
              id="intl-shift"
              layer="ngo_international"
              title="International governance shift, 2026 minus 2024"
              subtitle="Change in traced NGO and international-agency presence per stage. Gains cluster in governance and humanitarian stages; the assessment contraction reflects repatriation to Lebanese institutions."
              description="Diverging bar chart of change in traced international presence: strategy and coordination up 8, relief up 5, shelter up 4, oversight up 3, procurement up 1, assessment down 7."
            />
            <figure className="card p-5">
              <figcaption className="text-sm font-semibold text-[color:var(--color-navy)]">
                From assessment and humanitarian support to operational governance
              </figcaption>
              <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="rounded-md border border-[color:var(--color-y2024)] p-3 text-sm sm:flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2024)]">2024</p>
                  <p className="mt-1">Assessment and humanitarian support beside the state</p>
                </div>
                <span aria-hidden className="self-center text-xl text-[color:var(--color-text-secondary)]">→</span>
                <div className="rounded-md border border-[color:var(--color-y2026)] p-3 text-sm sm:flex-[2]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2026)]">2026</p>
                  <p className="mt-1">Operational governance around the project:</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {["Procurement", "Disclosure", "Safeguards", "Supervision", "Grievance mechanism", "Third-party monitoring"].map((t) => (
                      <li key={t} className="rounded-sm bg-[#E8F1F3] px-2 py-0.5 text-xs font-medium text-[color:var(--color-teal)]">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </figure>
          </>
        ) : null}
        {layer === "community" ? (
          <DivergingChangeChart
            id="community-shift"
            layer="community"
            title="Community-role reallocation, 2026 minus 2024"
            subtitle="Expanded: relief, coordination, shelter. Contracted: finance, rubble, debris, reconstruction."
            description="Diverging bar chart of change in traced community presence: relief up 35, coordination up 25, shelter up 7, livelihoods up 1; finance down 11, rubble down 9, debris down 5, reconstruction down 5."
          />
        ) : null}
        {layer === "official" ? (
          <DivergingChangeChart
            id="official-shift"
            layer="official"
            title="Official-institution change by stage, 2026 minus 2024"
            subtitle="Reconstruction and services rose 8 → 13; procurement 4 → 5; oversight 3 → 4; finance narrowed 15 → 7."
            description="Diverging bar chart of change in traced official-institution presence per value-chain stage."
          />
        ) : null}

        {content.coreFinding ? (
          <p className="rounded-md border-l-4 border-[color:var(--color-navy)] bg-white p-5 text-sm font-medium leading-relaxed">
            {content.coreFinding}
          </p>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
              Mandate versus action
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{content.mandateVsAction}</p>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
              Chain roles
            </h3>
            <dl className="mt-2 space-y-2.5 text-sm">
              <div>
                <dt className="font-semibold text-[color:var(--color-text-secondary)]">Finance</dt>
                <dd className="leading-relaxed">{content.financeRole}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[color:var(--color-text-secondary)]">Procurement</dt>
                <dd className="leading-relaxed">{content.procurementRole}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[color:var(--color-text-secondary)]">Implementation</dt>
                <dd className="leading-relaxed">{content.implementationRole}</dd>
              </div>
            </dl>
          </div>
        </section>

        <DeJureDeFacto layer={layer} />

        <RegionPresence layer={layer} showCaveat={false} />

        <ActorConcentration layer={layer} />
      </div>
    </div>
  );
}
