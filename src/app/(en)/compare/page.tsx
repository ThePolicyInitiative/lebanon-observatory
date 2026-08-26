import type { Metadata } from "next";
import { Suspense } from "react";
import ComparePanel from "./ComparePanel";
import StageCompositionChart from "@/components/charts/StageCompositionChart";
import LayerSlopeChart from "@/components/charts/LayerSlopeChart";
import YearHeatmaps from "@/components/charts/YearHeatmaps";
import ThreeStreams from "@/components/ThreeStreams";
import DisplacementCycle from "@/components/DisplacementCycle";
import Takeaways from "@/components/Takeaways";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/compare"),
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
    <PageShell
      title="Compare 2024 and 2026"
      lede={
        <>
          Eleven dimensions of the reconstruction system, stated analytically
          rather than generically. Use the control to view either year alone,
          side by side, or with the change stated explicitly.
        </>
      }
    >

      <div className="mt-6">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
          <ComparePanel />
        </Suspense>
      </div>

      {/* Year summaries */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section
          id="summary-2024"
          aria-label="2024 summary"
          className="rounded-md border-t-4 bg-white p-5"
          style={{ borderTopColor: "var(--color-y2024)" }}
        >
          <h2 className="text-lg font-semibold text-navy">
            2024: emergency substitution
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-text">
            {SUMMARY_2024.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-y2024" />
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section
          id="summary-2026"
          aria-label="2026 summary"
          className="rounded-md border-t-4 bg-white p-5"
          style={{ borderTopColor: "var(--color-y2026)" }}
        >
          <h2 className="text-lg font-semibold text-navy">
            2026: programmed architecture
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-text">
            {SUMMARY_2026.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-y2026" />
                {s}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Comparative conclusion */}
      <section
        aria-label="Comparative conclusion"
        className="mt-7 rounded-md border-l-4 border-navy bg-white p-6"
      >
        <blockquote className="editorial-quote max-w-4xl text-lg leading-relaxed text-navy">
          The shift was not from non-state delivery to state delivery. It was
          from fragmented substitution to a centrally managed project chain in
          which national institutions, international finance and contractors
          gained clearer roles, while municipalities and communities remained
          essential but weakly empowered.
        </blockquote>
      </section>

      {/* The 2026 structural qualification */}
      <div className="mt-8">
        <ThreeStreams />
      </div>

      {/* Composition data */}
      <div className="mt-8 space-y-7">
        <LayerSlopeChart />
        {/* The standing counts caution prints once, on YearHeatmaps. */}
        <YearHeatmaps />
        <StageCompositionChart showCaveat={false} />
      </div>

      {/* The delivery the system proved, twice */}
      <div className="mt-8">
        <DisplacementCycle />
      </div>

      <div className="mt-8">
        <Takeaways
          changed="Authority, finance and procurement acquired named owners inside a formal project perimeter; assessment was partially repatriated to Lebanese institutions; the emergency system improved at its own task."
          unchanged="Municipal fiscal authority, confirmed physical output and confirmed compensation: zero movement in all three. Households and communities continued to absorb the cost of every week of delay."
          matters="A system that is more coherent on paper but unchanged at its bottom is unstable: the amber dimensions - finance, procurement, oversight - are the ones the next reporting cycle can settle, toward delivery or toward procedure, and the tracking now exists to hold each conversion to a date."
        />
      </div>
    </PageShell>
  );
}
