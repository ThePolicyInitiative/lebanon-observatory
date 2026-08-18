import type { Metadata } from "next";
import { Suspense } from "react";
import ComparePanel from "./ComparePanel";
import StageCompositionChart from "@/components/charts/StageCompositionChart";
import LayerSlopeChart from "@/components/charts/LayerSlopeChart";
import YearHeatmaps from "@/components/charts/YearHeatmaps";
import RoleMixChart from "@/components/charts/RoleMixChart";
import ThreeStreams from "@/components/ThreeStreams";
import DisplacementCycle from "@/components/DisplacementCycle";
import Takeaways from "@/components/Takeaways";

export const metadata: Metadata = {
  title: "Compare 2024 and 2026",
  description:
    "Side-by-side comparison of Lebanon's reconstruction system in 2024 and 2026: authority, coordination, finance, assessment, procurement, implementation, municipal power, community substitution, oversight and confirmed outputs.",
};

const SUMMARY_2024 = [
  "Emergency-led",
  "Assessment-heavy",
  "Institutionally fragmented",
  "Dependent on humanitarian delivery",
  "Reliant on municipal, NGO, community and household substitution",
  "Lacking a financed national reconstruction programme",
  "Characterised by uneven accountability",
  "Stronger in immediate response than in the transition to reconstruction",
];

const SUMMARY_2026 = [
  "More centrally directed",
  "Organised around a formal project structure",
  "Linked to external finance",
  "Implemented through the CDR project unit, line ministries and contractors",
  "Governed by project procurement, safeguards, grievance and monitoring procedures",
  "Still weak in municipal fiscal authority",
  "Still limited in disbursement",
  "More advanced in procedures and procurement than in completed physical output",
];

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          Compare 2024 and 2026
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Eleven dimensions of the reconstruction system, stated analytically
          rather than generically. Use the control to view either year alone,
          side by side, or with the change stated explicitly.
        </p>
      </header>

      <div className="mt-6">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
          <ComparePanel />
        </Suspense>
      </div>

      {/* Year summaries */}
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <section
          aria-label="2024 summary"
          className="rounded-md border-t-4 bg-white p-5"
          style={{ borderTopColor: "var(--color-y2024)" }}
        >
          <h2 className="text-lg font-semibold text-[color:var(--color-navy)]">
            2024: emergency substitution
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--color-text)]">
            {SUMMARY_2024.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-y2024)]" />
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-label="2026 summary"
          className="rounded-md border-t-4 bg-white p-5"
          style={{ borderTopColor: "var(--color-y2026)" }}
        >
          <h2 className="text-lg font-semibold text-[color:var(--color-navy)]">
            2026: programmed architecture
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--color-text)]">
            {SUMMARY_2026.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-y2026)]" />
                {s}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Comparative conclusion */}
      <section
        aria-label="Comparative conclusion"
        className="mt-10 rounded-md border-l-4 border-[color:var(--color-navy)] bg-white p-6"
      >
        <blockquote className="editorial-quote max-w-4xl text-lg leading-relaxed text-[color:var(--color-navy)]">
          The shift was not from non-state delivery to state delivery. It was
          from fragmented substitution to a centrally managed project chain in
          which national institutions, international finance and contractors
          gained clearer roles, while municipalities and communities remained
          essential but weakly empowered.
        </blockquote>
      </section>

      {/* The 2026 structural qualification */}
      <div className="mt-12">
        <ThreeStreams />
      </div>

      {/* Composition data */}
      <div className="mt-12 space-y-10">
        <LayerSlopeChart />
        {/* The standing counts caution prints once, on YearHeatmaps. */}
        <YearHeatmaps />
        <StageCompositionChart showCaveat={false} />
        <RoleMixChart showCaveat={false} />
      </div>

      {/* The delivery the system proved, twice */}
      <div className="mt-12">
        <DisplacementCycle />
      </div>

      <div className="mt-12">
        <Takeaways
          changed="Authority, finance and procurement acquired named owners inside a formal project perimeter; assessment was partially repatriated to Lebanese institutions; the emergency system improved at its own task."
          unchanged="Municipal fiscal authority, confirmed physical output and confirmed compensation: zero movement in all three. Households and communities continued to absorb the cost of every week of delay."
          matters="A system that is more coherent on paper but unchanged at its bottom is unstable: the amber dimensions - finance, procurement, oversight - will resolve toward delivery or toward procedure within the next reporting cycle, and the tracking now exists to hold each conversion to a date."
        />
      </div>
    </div>
  );
}
