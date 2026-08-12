import type { Metadata } from "next";
import Link from "next/link";
import SectorDamageChart from "@/components/charts/SectorDamageChart";
import WorstCadastersChart from "@/components/charts/WorstCadastersChart";
import DebrisTiles from "@/components/charts/DebrisTiles";
import ServiceImpact from "@/components/ServiceImpact";
import DistrictDamageChart from "@/components/charts/DistrictDamageChart";
import HumanToll from "@/components/HumanToll";
import Takeaways from "@/components/Takeaways";
import destruction from "@/data/destruction.json";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Damage assessments",
  description:
    "The building-destruction data for Lebanon's 2024 and 2026 wars: four non-additive 2024 tracks, sector damage and losses, and the two bounded 2026 assessment zones - presented side by side, never merged.",
};

const COMPARABILITY_BADGE: Record<string, { label: string; cls: string }> = {
  not_comparable: {
    label: "Not directly comparable",
    cls: "bg-[#F7E9E5] text-[color:var(--color-rust)]",
  },
  context_only: {
    label: "Context only",
    cls: "bg-[#EEF2F7] text-[color:var(--color-text-secondary)]",
  },
};

export default function DamagePage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          The damage assessments - kept honest
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          No single building count exists for the 2024 war, and no national
          assessment existed for the 2026 war by the cut-off. This
          page presents every major damage estimate side by side with its
          method, scope, unit and comparability badge - and never averages,
          sums or merges them. The plurality of estimates is itself data:
          it delayed a single authoritative baseline for compensation, which
          every claims system needs, while giving the response its fastest
          early data.
        </p>
      </header>

      {/* Four 2024 tracks */}
      <section aria-labelledby="tracks-2024" className="mt-10">
        <h2 id="tracks-2024" className="text-xl font-semibold text-[color:var(--color-navy)]">
          2024: four non-additive tracks bracket the destruction
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-text-secondary)]">
          The spread between the tracks reflects method (satellite radar
          versus optical imagery versus municipal declaration), scope (four
          versus six governorates), unit (buildings versus dwellings) and
          timing - not error.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {destruction.tracks2024.map((t) => (
            <article
              key={t.id}
              className="flex flex-col card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug text-[color:var(--color-navy)]">
                  {t.label}
                </h3>
                <span
                  className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${COMPARABILITY_BADGE[t.comparability].cls}`}
                >
                  {COMPARABILITY_BADGE[t.comparability].label}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold tabular-nums text-[color:var(--color-navy)]">
                {t.headline}
              </p>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[color:var(--color-text)]">
                {t.detail}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-[color:var(--color-border)] pt-2.5 text-[11px] text-[color:var(--color-text-secondary)]">
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
        <div className="mt-4 card p-4">
          <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
            2024 debris
          </h3>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[color:var(--color-navy)]">
            {destruction.debris2024.headline}
          </p>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed">
            {destruction.debris2024.detail}
          </p>
        </div>
      </section>

      {/* District-level municipal survey */}
      <section aria-labelledby="district-survey" className="mt-12">
        <h2 id="district-survey" className="sr-only">
          Municipality-reported damage by district
        </h2>
        <DistrictDamageChart />
      </section>

      {/* Sector chart */}
      <section aria-labelledby="sector-chart" className="mt-12">
        <h2 id="sector-chart" className="text-xl font-semibold text-[color:var(--color-navy)]">
          Sector damage, losses and needs
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-text-secondary)]">
          The structural signature is the same everywhere: damage that public
          budgets must repair is the smaller number; losses that only economic
          recovery can restore are the larger one.
        </p>
        <div className="mt-5">
          <SectorDamageChart />
        </div>
      </section>

      {/* 2026 zones */}
      <section aria-labelledby="zones-2026" className="mt-12">
        <h2 id="zones-2026" className="text-xl font-semibold text-[color:var(--color-navy)]">
          2026: two bounded assessment zones - not a national picture
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-text-secondary)]">
          Within their zones, the 2026 numbers describe destruction
          approaching 2024&apos;s southern intensity in one-third the time.
          The two products use different verification methods and must not
          share a legend; neither is cumulative with any 2024 figure.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {destruction.zones2026.map((z) => (
            <article
              key={z.id}
              className="flex flex-col rounded-md border border-[color:var(--color-border)] bg-white"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-2.5">
                <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                  {z.label}
                </h3>
                <div className="flex gap-1.5">
                  <span className="rounded-sm bg-[#E8F1F3] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-teal)]">
                    {z.verification}
                  </span>
                  <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${COMPARABILITY_BADGE[z.comparability].cls}`}>
                    {COMPARABILITY_BADGE[z.comparability].label}
                  </span>
                </div>
              </header>
              <div className="flex-1 space-y-2.5 p-4 text-[13px] leading-relaxed">
                <p className="text-lg font-semibold tabular-nums text-[color:var(--color-navy)]">
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
                {z.worstCadasters.length > 0 ? (
                  <div>
                    <p className="font-semibold">
                      Worst cadasters (destroyed buildings):
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {z.worstCadasters.map((c) => (
                        <li key={c.name} className="rounded-sm bg-[color:var(--color-bg)] px-2 py-0.5 text-xs tabular-nums">
                          {c.name}: <strong>{c.destroyed.toLocaleString("en-US")}</strong>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-xs text-[color:var(--color-text-secondary)]">
                      The same border communities levelled in 2024 - repetition
                      converts reconstruction from a stock problem (rebuild X)
                      into a flow problem (rebuild under recurrence risk).
                    </p>
                  </div>
                ) : null}
                <p className="text-xs text-[color:var(--color-text-secondary)]">
                  <span className="font-semibold">Method: </span>
                  {z.method}
                </p>
                <p className="text-xs text-[color:var(--color-text-secondary)]">
                  <span className="font-semibold">Comparability: </span>
                  {z.comparabilityNote}
                </p>
              </div>
              <p className="border-t border-dashed border-[color:var(--color-border)] px-4 py-2.5 text-[11px] text-[color:var(--color-text-secondary)]">
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

        <div className="mt-6">
          <ServiceImpact />
        </div>

        <div className="mt-10">
          <HumanToll />
        </div>

        <ul className="mt-4 space-y-2">
          {destruction.zones2026Notes.map((n) => (
            <li
              key={n.slice(0, 30)}
              className="border-l-2 border-[color:var(--color-amber)] bg-white p-3 pl-4 text-[13px] leading-relaxed"
            >
              {n}
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-md border border-dashed border-[color:var(--color-border)] bg-white p-4">
          <p className="text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
            <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Context only
            </span>{" "}
            {destruction.presidentialEstimate.detail}
          </p>
        </div>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/map" className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline">
          See where traced activity concentrated →
        </Link>{" "}
        ·{" "}
        <Link href="/finance" className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline">
          See what financing followed the data →
        </Link>
      </p>

      <div className="mt-12">
        <Takeaways
          changed="Assessment became the state's cleanest capability gain: 2026 products arrived in weeks, jointly produced with a Lebanese scientific institution, methodologically explicit about their own limits."
          unchanged="No single authoritative baseline exists for either war - the denominator every compensation system needs - and the Bekaa, Baalbek-Hermel and the North remained unassessed in 2026."
          matters="Data geography becomes financing geography: programmes fund what is measured, so unassessed areas enter any future instrument late and weakly. And the assessed 2026 damage (~US$1.75B in two zones) sits entirely outside the only financed programme's legal scope."
        />
      </div>
    </div>
  );
}
