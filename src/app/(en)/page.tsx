import type { Metadata } from "next";
import Link from "next/link";
import KpiCard from "@/components/KpiCard";
import ReconstructionPulse from "@/components/ReconstructionPulse";
import InstitutionalShiftDiagram from "@/components/charts/InstitutionalShiftDiagram";
import InstitutionalStructures from "@/components/InstitutionalStructures";
import { Suspense } from "react";
import ComparePanel from "@/components/ComparePanel";
import ThreeStreams from "@/components/ThreeStreams";
import NewsTeaser from "@/components/news/NewsTeaser";
import { SectionHeading } from "@/components/HomeNarrative";
import { kpis, locations } from "@/lib/data";
import { GOV_PATHS, VIEW_H, VIEW_W } from "@/lib/geo";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: localeAlternates("/"),
  title: "Lebanon Reconstruction Observatory",
  description:
    "From emergency substitution to programmed reconstruction: how Lebanon's post-war reconstruction system changed between 2024 and 2026.",
};

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
      <section className="on-navy relative overflow-hidden border-b border-[#0e2542] bg-navy bg-[linear-gradient(160deg,#122e50_0%,#173b63_55%,#1c4a7c_100%)]">
        <svg
          aria-hidden
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
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
          <p className="text-sm font-semibold uppercase tracking-widest text-amber">
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
            {/* The year contrast used to be its own page, and this sent the
                reader to it. It is a section of this one now, so the button
                scrolls rather than navigating - pointed at "/" it was a
                link from the home page to the home page. */}
            <Link
              href="#role-shift"
              className="inline-flex min-h-11 items-center rounded-md bg-amber px-5 text-sm font-semibold text-[#2a1e00] transition-colors duration-150 hover:bg-[#e8ab1a]"
            >
              Explore the 2024–2026 shift
            </Link>
            <Link
              href="/who"
              className="inline-flex min-h-11 items-center rounded-md border border-white/60 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
            >
              Open the reconstruction map
            </Link>
            <Link
              href="/reported"
              className="inline-flex min-h-11 items-center rounded-md border border-white/25 px-5 text-sm font-semibold text-white/80 transition-colors duration-150 hover:border-white/60 hover:text-white"
            >
              View live updates
            </Link>
          </div>
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
          className="text-xl font-semibold text-navy sm:text-2xl"
        >
          Key indicators - each dated, scoped and typed
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary">
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
            <p className="mt-3 text-sm leading-relaxed text-text">
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
            <p className="mt-3 text-sm leading-relaxed text-text">
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
            <p className="mt-3 text-sm leading-relaxed text-text">
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
            <p className="mt-3 text-sm leading-relaxed text-text">
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
          {/*
           * The two heat maps moved to /who, the page that asks who is
           * doing what. They were drawn here as well, so one figure
           * appeared twice on the site and a reader had no way to tell
           * which was the authoritative one.
           *
           * The verdict panel says what they say, in eleven rows, and
           * links to each dimension on the page that owns its subject. It
           * was the whole of /compare, which was an axis pretending to be
           * a topic - the year is a control, not a destination.
           */}
          <div className="mt-6">
            <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
              <ComparePanel />
            </Suspense>
          </div>
          <div className="mt-6">
            <ThreeStreams />
          </div>
          <p className="mt-3 text-sm">
            <Link
              href="/who"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              Explore each actor layer in depth →
            </Link>
          </p>
        </section>

        <section id="finance-delivery" aria-label="Finance versus delivery">
          <SectionHeading index={5} title="Finance versus delivery">
            <p className="mt-3 text-sm leading-relaxed text-text">
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
              href="/money"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              Full finance and delivery analysis →
            </Link>
          </p>
        </section>

        <section id="geography" aria-label="Geography of traced activity">
          <SectionHeading index={6} title="Geography of traced activity">
            <p className="mt-3 text-sm leading-relaxed text-text">
              Traced activity concentrated along the southern arc and the
              Dahieh belt in both years, while assessment coverage - and
              therefore future financing eligibility - remained uneven.
              Mentions in the tracking show where traced activity was
              concentrated, not damage severity or beneficiary reach.
            </p>
          </SectionHeading>
          <div className="mt-6 overflow-x-auto card">
            <table className="min-w-full border-collapse text-sm tabular-nums">
              <caption className="pb-2 text-left text-xs text-text-secondary">
                Total location mentions in the tracking by regional
                grouping (all actor layers).
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-left font-semibold text-navy">Region</th>
                  <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-right font-semibold text-navy">2024</th>
                  <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-right font-semibold text-navy">2026</th>
                </tr>
              </thead>
              <tbody>
                {regionRows.map((r) => (
                  <tr key={r.label} className="odd:bg-bg">
                    <td className="border-b border-border px-2 py-1.5">{r.label}</td>
                    <td className="border-b border-border px-2 py-1.5 text-right">{r.t24}</td>
                    <td className="border-b border-border px-2 py-1.5 text-right">{r.t26}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">
            <Link
              href="/who"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              Open the interactive map →
            </Link>{" "}
            ·{" "}
            <Link
              href="/destroyed"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              Examine the damage assessments →
            </Link>
          </p>
        </section>

        <section id="latest-news" aria-label="Latest news and official updates">
          <SectionHeading index={7} title="Latest news and official updates">
            <p className="mt-3 text-sm leading-relaxed text-text">
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
          className="rounded-md border-l-4 border-navy bg-white p-6"
        >
          <blockquote className="editorial-quote max-w-4xl text-lg leading-relaxed text-navy">
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
