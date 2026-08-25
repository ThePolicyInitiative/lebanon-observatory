import type { Metadata } from "next";
import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import ReconstructionPulse from "@/components/ReconstructionPulse";
import InstitutionalShiftDiagram from "@/components/charts/InstitutionalShiftDiagram";
import InstitutionalStructures from "@/components/InstitutionalStructures";
import dynamic from "next/dynamic";

/** Below the fold and carrying the full data text for its drawer. */
const ChangeHeatmap = dynamic(() => import("@/components/charts/ChangeHeatmap"), {
  loading: () => <div className="h-96 animate-pulse rounded-md bg-white" />,
});
import YearHeatmaps from "@/components/charts/YearHeatmaps";
import NewsTeaser from "@/components/news/NewsTeaser";
import { kpis, locations } from "@/lib/data";
import { GOV_PATHS } from "@/lib/geo";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: localeAlternates("/"),
  title: "Lebanon Reconstruction Observatory",
  description:
    "From emergency substitution to programmed reconstruction: how Lebanon's post-war reconstruction system changed between 2024 and 2026.",
};

function SectionHeading({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="prose-measure">
      <p className="flex items-center gap-2.5 font-sans text-xs font-bold uppercase tracking-widest text-[color:var(--color-teal)]">
        {String(index).padStart(2, "0")}
        <span aria-hidden className="h-px w-8 bg-[color:var(--color-amber)]" />
      </p>
      <h2 className="mt-2 text-[26px] font-semibold sm:text-[30px]">{title}</h2>
      {children}
    </div>
  );
}

export default function HomePage() {
  const regionRows = locations.regions
    .filter((r) => r.id !== "national_multi" && r.id !== "named_localities")
    .map((r) => {
      const m24 = locations.mentions["2024"][r.id as keyof (typeof locations.mentions)["2024"]];
      const m26 = locations.mentions["2026"][r.id as keyof (typeof locations.mentions)["2026"]];
      const t24 = m24.official + m24.municipal + m24.ngo_international + m24.community;
      const t26 = m26.official + m26.municipal + m26.ngo_international + m26.community;
      return { label: r.label, t24, t26 };
    });

  return (
    <div>
      {/* Hero */}
      <section className="on-navy relative overflow-hidden border-b border-[#0e2542] bg-[color:var(--color-navy)] bg-[linear-gradient(160deg,#122e50_0%,#173b63_55%,#1c4a7c_100%)]">
        <svg
          aria-hidden
          viewBox="0 0 620 860"
          className="pointer-events-none absolute -right-8 top-1/2 hidden h-[135%] -translate-y-1/2 lg:block"
        >
          {GOV_PATHS.map((p) => (
            <path
              key={p.name}
              d={p.d}
              fill="#FFFFFF"
              fillOpacity={0.03}
              stroke="#FFFFFF"
              strokeOpacity={0.14}
              strokeWidth={1.2}
            />
          ))}
        </svg>
        <div className="relative mx-auto max-w-[1360px] px-4 py-8 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-[color:var(--color-amber)]">
            Lebanon Reconstruction Observatory
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            From Emergency Substitution to Programmed Reconstruction
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/85 sm:text-lg">
            In 2024, emergency committees, municipalities, NGOs, communities and
            household self-recovery filled gaps left by the absence of a
            financed reconstruction programme. By 2026, Lebanon had established
            a more formal project architecture linking government direction,
            external finance, public implementation, contractors, procurement
            and monitoring. The chain became clearer - but finance remained
            limited, municipalities did not gain meaningful authority, and
            completed physical reconstruction lagged behind institutional
            preparation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/compare"
              className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--color-amber)] px-5 text-sm font-semibold text-[#2a1e00] transition-colors duration-150 hover:bg-[#e8ab1a]"
            >
              Explore the 2024–2026 shift
            </Link>
            <Link
              href="/map"
              className="inline-flex min-h-11 items-center rounded-md border border-white/60 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
            >
              Open the reconstruction map
            </Link>
            <Link
              href="/news"
              className="inline-flex min-h-11 items-center rounded-md border border-white/25 px-5 text-sm font-semibold text-white/80 transition-colors duration-150 hover:border-white/60 hover:text-white"
            >
              View live updates
            </Link>
          </div>
          {/* At a glance */}
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/20 pt-6 sm:grid-cols-4">
            {[
              ["771", "traced entries in the tracking (357 for 2024; 414 for 2026)"],
              ["105 → 130", "actors catalogued across the four layers, 2024 → 2026; 129 of the 130 carry traced entries"],
              ["12 × 4 × 2", "value-chain stages × actor layers × years, recomputed at entry level"],
              ["0", "works contracts awarded, confirmed completed outputs and confirmed compensation payments by the cut-off"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="figure-number block text-[27px] text-white">{n}</span>
                  <span className="mt-1.5 block text-[11px] leading-snug text-white/65">
                    {label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 max-w-3xl text-[11px] leading-snug text-white/55">
            Two counts coexist by design: the charts on the compare and actors
            pages read the report-level actor-stage counts (343 for 2024; 360
            for 2026, with the report&apos;s 363 recomputation flagged on the
            compare page), while the explorer and the register list the finer
            underlying entries counted here. An actor can carry several entries
            within one stage.
          </p>
        </div>
      </section>

      <ReconstructionPulse />

      {/* KPIs */}
      <section
        aria-labelledby="kpi-heading"
        className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6"
      >
        <h2
          id="kpi-heading"
          className="text-xl font-semibold text-[color:var(--color-navy)] sm:text-2xl"
        >
          Key indicators - each dated, scoped and typed
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-text-secondary)]">
          Needs, frameworks, commitments and disbursements are different
          objects. The US$1 billion LEAP framework is not equivalent to the
          US$11 billion national need, and disbursement is not delivery.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      {/* Narrative sequence */}
      <div className="mx-auto max-w-[1360px] space-y-16 px-4 pb-16 sm:px-6">
        <section id="emergency-2024" aria-label="The 2024 emergency system">
          <SectionHeading index={1} title="The 2024 emergency system">
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text)]">
              A war of national scale hit a state with no head of state, no
              empowered cabinet and no money. Coordination and data
              production remained genuinely public functions - the emergency
              committee, the DRM Unit and the operations room worked as
              designed - while finance and implementation had no public owner
              at all. Shelter for nearly 190,000 people scaled in weeks because
              it ran on assets the state already owned; compensation could not
              start in months because it required money and rules that did not
              exist.
            </p>
          </SectionHeading>
        </section>

        <section id="implementation-middle" aria-label="The missing implementation middle">
          <SectionHeading index={2} title="The missing implementation middle">
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text)]">
              The 2024 chain broke at two conversion points: data into
              finance, and finance into contracts. Traced public
              procurement for the entire year consisted essentially of one
              rubble tender launched on 27 December. With no public contracting
              bridge, implementation demand flowed around the state - to
              households, to the parallel track, and to agencies - at their own
              cost and risk.
            </p>
          </SectionHeading>
        </section>

        <section id="structures" aria-label="The command structures, 2024 and 2026">
          <SectionHeading index={3} title="The command structures, side by side">
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text)]">
              The report&apos;s two structure diagrams, validated against the
              tracking and rebuilt here: the 2024 emergency system that
              coordinated without a financed delivery vehicle, and the 2026
              settlement of two chains under one government - separated by the
              army clearance gate, joined by the same unresolved gap.
            </p>
          </SectionHeading>
          <div className="mt-6">
            <InstitutionalStructures />
          </div>
          <div className="mt-8">
            <InstitutionalShiftDiagram />
          </div>
        </section>

        <section id="role-shift" aria-label="Who gained and lost roles">
          <SectionHeading index={4} title="Who gained and lost roles">
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text)]">
              The system rotated rather than grew. Official institutions
              consolidated into programmed reconstruction and grew in
              procurement and oversight cells that were thin before.
              International actors moved from assessment toward operational
              governance around the project. Municipalities thinned overall -
              19 traced entries to 12 - without gaining authority anywhere.
              Community initiatives surged in relief and coordination while
              contracting out of finance, rubble and physical reconstruction.
            </p>
          </SectionHeading>
          <div className="mt-6 space-y-6">
            {/* The standing counts caution prints once per page, on the
                first figure below; the repeat here is suppressed. */}
            <YearHeatmaps />
            <ChangeHeatmap showCaveat={false} />
          </div>
          <p className="mt-3 text-sm">
            <Link
              href="/actors"
              className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
            >
              Explore each actor layer in depth →
            </Link>
          </p>
        </section>

        <section id="finance-delivery" aria-label="Finance versus delivery">
          <SectionHeading index={5} title="Finance versus delivery">
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text)]">
              Institutional architecture advanced faster than money and
              physical delivery. Procurement under way is a process milestone,
              not data of completed reconstruction.
            </p>
          </SectionHeading>
          {/* The funnel and the waffle live on /finance. They were embedded
              here too, printing the same two figures twice on the site; the
              numbers they carry are already in the indicator strip above. */}
          <p className="mt-3 text-sm">
            <Link
              href="/finance"
              className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
            >
              Full finance and delivery analysis →
            </Link>
          </p>
        </section>

        <section id="geography" aria-label="Geography of traced activity">
          <SectionHeading index={6} title="Geography of traced activity">
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text)]">
              Traced activity concentrated along the southern arc and the
              Dahieh belt in both years, while assessment coverage - and
              therefore future financing eligibility - remained uneven.
              Mentions in the tracking show where traced activity was
              concentrated, not damage severity or beneficiary reach.
            </p>
          </SectionHeading>
          <div className="mt-6 overflow-x-auto card p-3.5">
            <table className="min-w-full border-collapse text-sm tabular-nums">
              <caption className="pb-2 text-left text-xs text-[color:var(--color-text-secondary)]">
                Total location mentions in the tracking by regional
                grouping (all actor layers).
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2 py-1.5 text-left font-semibold text-[color:var(--color-navy)]">Region</th>
                  <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2 py-1.5 text-right font-semibold text-[color:var(--color-navy)]">2024</th>
                  <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2 py-1.5 text-right font-semibold text-[color:var(--color-navy)]">2026</th>
                </tr>
              </thead>
              <tbody>
                {regionRows.map((r) => (
                  <tr key={r.label} className="odd:bg-[color:var(--color-bg)]">
                    <td className="border-b border-[color:var(--color-border)] px-2 py-1.5">{r.label}</td>
                    <td className="border-b border-[color:var(--color-border)] px-2 py-1.5 text-right">{r.t24}</td>
                    <td className="border-b border-[color:var(--color-border)] px-2 py-1.5 text-right">{r.t26}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            <Link
              href="/map"
              className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
            >
              Open the interactive map →
            </Link>{" "}
            ·{" "}
            <Link
              href="/damage"
              className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
            >
              Examine the damage assessments →
            </Link>
          </p>
        </section>

        <section id="latest-news" aria-label="Latest news and official updates">
          <SectionHeading index={7} title="Latest news and official updates">
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text)]">
              This feed aggregates relevant coverage from selected global,
              Lebanese, humanitarian and official publishers. It is broad but not
              exhaustive, and it is kept strictly separate from the confirmed
              analysis.
            </p>
          </SectionHeading>
          <div className="mt-6">
            <NewsTeaser />
          </div>
        </section>

        {/* Central conclusion */}
        <section
          aria-label="Central conclusion"
          className="rounded-md border-l-4 border-[color:var(--color-navy)] bg-white p-6"
        >
          <blockquote className="editorial-quote max-w-4xl text-lg leading-relaxed text-[color:var(--color-navy)]">
            Between 2024 and 2026, Lebanon moved from fragmented emergency
            substitution to a more formal, externally financed and centrally
            managed project architecture. The change clarified national,
            international and contractor roles, but it did not transfer
            meaningful finance or implementation authority to municipalities.
            Community and NGO actors continued to absorb humanitarian and
            social-recovery pressures, while confirmed physical reconstruction
            lagged behind institutional design.
          </blockquote>
        </section>
      </div>
    </div>
  );
}
