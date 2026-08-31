import type { Metadata } from "next";
import Link from "next/link";
import SectorDamageChart from "@/components/charts/SectorDamageChart";
import WorstCadastersChart from "@/components/charts/WorstCadastersChart";
import DebrisTiles from "@/components/charts/DebrisTiles";
import ServiceImpact from "@/components/ServiceImpact";
import DistrictDamageChart from "@/components/charts/DistrictDamageChart";
import HumanToll from "@/components/HumanToll";
import SeeMore from "@/components/SeeMore";
import Takeaways from "@/components/Takeaways";
import DisplacementCycle from "@/components/DisplacementCycle";
import WaterRepairs from "@/components/WaterRepairs";
import ServiceOperators from "@/components/ServiceOperators";
import destruction from "@/data/destruction.json";
import { fmtDate } from "@/lib/format";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/destroyed"),
  title: "What was destroyed?",
  description:
    "The estimates behind the US$11 billion needs benchmark: four non-additive 2024 tracks, sector damage and losses, and the two bounded 2026 assessment zones - presented side by side, never merged.",
};

const COMPARABILITY_BADGE: Record<string, { label: string; cls: string }> = {
  not_comparable: {
    label: "Not directly comparable",
    cls: "bg-[#F7E9E5] text-rust",
  },
  context_only: {
    label: "Context only",
    cls: "bg-[#EEF2F7] text-text-secondary",
  },
};

export default function DamagePage() {
  return (
    <PageShell
      title="The damage assessments - kept honest"
      lede={
        <>
          The depth behind the{" "}
          <Link
            href="/#findings"
            className="font-medium text-blue underline-offset-2 hover:underline"
          >
            report&apos;s needs benchmark
          </Link>
          : the estimates that sit under the US$11 billion figure, each
          presented with its method, scope, unit and comparability - and never
          averaged, summed or merged. No single building count exists for the
          2024 war, and no national assessment existed for the 2026 war by 31
          August 2026. The plurality is itself a finding: it gave the response
          its fastest early figures while delaying the single baseline every
          compensation system needs.
        </>
      }
    >

      {/* Four 2024 tracks */}
      <section aria-labelledby="tracks-2024" className="mt-7">
        <h2 id="tracks-2024" className="text-h2 font-semibold text-navy">
          2024: four non-additive tracks bracket the destruction
        </h2>
        <p className="mt-2 max-w-3xl text-body text-text-secondary">
          The spread between the tracks reflects method (satellite radar
          versus optical imagery versus municipal declaration), scope (four
          versus six governorates), unit (buildings versus dwellings) and
          timing - not error.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {destruction.tracks2024.map((t) => (
            <article
              key={t.id}
              className="flex flex-col card"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-body font-semibold leading-snug text-navy">
                  {t.label}
                </h3>
                <span
                  className={`shrink-0 rounded-sm px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide ${COMPARABILITY_BADGE[t.comparability].cls}`}
                >
                  {COMPARABILITY_BADGE[t.comparability].label}
                </span>
              </div>
              <p className="mt-2 text-h3 font-semibold tabular-nums text-navy">
                {t.headline}
              </p>
              <p className="mt-2 flex-1 text-meta leading-relaxed text-text">
                {t.detail}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-border pt-2.5 text-micro text-text-secondary">
                <div>
                  <dt className="font-semibold">Method</dt>
                  <dd>{t.method}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Scope</dt>
                  <dd>{t.scope}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Unit</dt>
                  <dd>{t.unit}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="mt-4 card">
          <h3 className="text-body font-semibold text-navy">
            2024 debris
          </h3>
          <p className="mt-1 text-h3 font-semibold tabular-nums text-navy">
            {destruction.debris2024.headline}
          </p>
          <p className="mt-1.5 max-w-3xl text-meta leading-relaxed">
            {destruction.debris2024.detail}
          </p>
        </div>
      </section>

      {/* District-level municipal survey */}
      <section aria-labelledby="district-survey" className="mt-8">
        <h2 id="district-survey" className="sr-only">
          Municipality-reported damage by district
        </h2>
        <DistrictDamageChart />
      </section>

      {/* Sector chart */}
      <section aria-labelledby="sector-chart" className="mt-8">
        <h2 id="sector-chart" className="text-h2 font-semibold text-navy">
          Sector damage, losses and needs
        </h2>
        <p className="mt-2 max-w-3xl text-body text-text-secondary">
          The structural signature is the same everywhere: damage that public
          budgets must repair is the smaller number; losses that only economic
          recovery can restore are the larger one.
        </p>
        <div className="mt-5">
          <SectorDamageChart />
        </div>
      </section>

      {/* 2026 zones */}
      <section aria-labelledby="zones-2026" className="mt-8">
        <h2 id="zones-2026" className="text-h2 font-semibold text-navy">
          2026: two bounded assessment zones - not a national picture
        </h2>
        <p className="mt-2 max-w-3xl text-body text-text-secondary">
          Within their zones, the 2026 numbers describe destruction
          approaching 2024&apos;s southern intensity in one-third the time.
          The two products use different confirmation methods and must not
          share a legend; neither is cumulative with any 2024 figure.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {destruction.zones2026.map((z) => (
            <article
              key={z.id}
              className="flex flex-col rounded-md border border-border bg-white"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg px-4 py-2.5">
                <h3 className="text-body font-semibold text-navy">
                  {z.label}
                </h3>
                <div className="flex gap-1.5">
                  <span className="rounded-sm bg-[#E8F1F3] px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-teal">
                    {z.checkedBy}
                  </span>
                  <span className={`rounded-sm px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide ${COMPARABILITY_BADGE[z.comparability].cls}`}>
                    {COMPARABILITY_BADGE[z.comparability].label}
                  </span>
                </div>
              </header>
              <div className="flex-1 space-y-2.5 p-4 text-meta leading-relaxed">
                <p className="text-h3 font-semibold tabular-nums text-navy">
                  {z.assessedDamage}
                </p>
                <p>
                  <span className="font-semibold">Buildings: </span>
                  {z.buildings}
                </p>
                <p>
                  <span className="font-semibold">Debris: </span>
                  {z.debris}
                </p>
                {/* The four cadaster values are charted directly below, so
                    the card carries the point they make rather than the
                    numbers a second time. */}
                {z.worstCadasters.length > 0 ? (
                  <p className="text-meta text-text-secondary">
                    Its worst-hit cadasters, charted below, are the same border
                    communities levelled in 2024 - repetition converts
                    reconstruction from a stock problem (rebuild X) into a flow
                    problem (rebuild under recurrence risk).
                  </p>
                ) : null}
                <p className="text-meta text-text-secondary">
                  <span className="font-semibold">Method: </span>
                  {z.method}
                </p>
                <p className="text-meta text-text-secondary">
                  <span className="font-semibold">Comparability: </span>
                  {z.comparabilityNote}
                </p>
              </div>
              <p className="border-t border-dashed border-border px-4 py-2.5 text-micro text-text-secondary">
                Published {fmtDate(z.published)} (UNDP &amp; CNRS-L)
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <WorstCadastersChart />
        </div>

        <div className="mt-6">
          <DebrisTiles />
        </div>

        <div className="mt-7">
          <HumanToll />
        </div>

        <ul className="mt-4 space-y-2">
          {destruction.zones2026Notes.map((n) => (
            <li
              key={n.slice(0, 30)}
              className="border-l-2 border-amber bg-white p-3 pl-4 text-meta leading-relaxed"
            >
              {n}
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-md border border-dashed border-border bg-white p-4">
          <p className="text-meta leading-relaxed text-text-secondary">
            <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide">
              Context only
            </span>{" "}
            {destruction.presidentialEstimate.detail}
          </p>
        </div>
      </section>

      <div className="mt-8">
        <SeeMore label="the shelter-and-return cycle, run twice">
          <DisplacementCycle />
        </SeeMore>
      </div>

      {/* Services and networks: the operator-reported account in one place,
          with the two long registers folded behind the dated sector figures. */}
      <section aria-labelledby="services-networks" className="mt-8">
        <h2 id="services-networks" className="text-h2 font-semibold text-navy">
          Services and networks, as operators reported them
        </h2>
        <p className="mt-2 max-w-3xl text-body text-text-secondary">
          What stopped and what came back under the 2026 war, in the operating
          institutions&apos; own published figures. The dated sector status
          leads; the two long operator registers open below it.
        </p>
        <div className="mt-5">
          <ServiceImpact />
        </div>
        <SeeMore label="the water office's repairs, line by line">
          <WaterRepairs />
        </SeeMore>
        <SeeMore label="the networks, operator by operator">
          <ServiceOperators />
        </SeeMore>
      </section>

      <p className="mt-8 text-body">
        <Link href="/who" className="font-medium text-blue underline-offset-2 hover:underline">
          See who was traced acting, and where →
        </Link>{" "}
        ·{" "}
        <Link href="/money" className="font-medium text-blue underline-offset-2 hover:underline">
          See what financing followed the data →
        </Link>
      </p>

      <div className="mt-8">
        <Takeaways
          changed="2026 was assessed faster and more openly than 2024: joint products with a Lebanese scientific institution, out in weeks, each stating its own limits - but covering two bounded zones where the 2024 tracks reached four to six governorates."
          unchanged="Neither war has one authoritative building count, and the gap has a geography: the Bekaa and Baalbek-Hermel were never assessed in 2026, so the two zones' roughly US$1.75 billion is a floor for two areas, not a national figure."
          matters="Programmes fund what is measured. Unassessed areas enter any future financing instrument late and weakly, and the assessed 2026 damage sits entirely outside the legal scope of the only financed programme."
        />
      </div>
    </PageShell>
  );
}
