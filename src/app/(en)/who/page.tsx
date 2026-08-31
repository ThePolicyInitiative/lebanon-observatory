import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import ActorTabs from "./ActorTabs";
import ActorTreemap from "@/components/charts/ActorTreemap";
/**
 * These two were lazily loaded because each pulled the whole register into
 * the browser. They now reduce and project on the server and hand small
 * props to their interactive halves, so a plain import is both simpler and
 * faster - nothing heavy is left to defer.
 */
import ActorStageMatrix from "./ActorStageMatrix";
import ActorRegister from "./ActorRegister";
import LayerSlopeChart from "@/components/charts/LayerSlopeChart";
import YearHeatmaps from "@/components/charts/YearHeatmaps";
import ChangeHeatmap from "@/components/charts/ChangeHeatmap";
import StageCompositionChart from "@/components/charts/StageCompositionChart";
import LebanonMap from "@/components/map/LebanonMap";
import RegionalComposition from "@/components/map/RegionalComposition";
import Takeaways from "@/components/Takeaways";
import { locations } from "@/lib/data-client";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/who"),
  title: "Who is doing what?",
  description:
    "Which named bodies were traced acting in Lebanon's reconstruction, in what role, at which stage and in which town - four actor layers across 2024 and 2026, with the map of where the traced activity actually sits.",
};

/**
 * Who is doing what.
 *
 * The page answers one question, and everything that helps answer it lives
 * here rather than in a tab of its own. That is why the map is on this
 * page: "map" was never a question a reader arrives with, it is how this
 * one gets drawn - who was present, and where. Splitting the two meant a
 * reader comparing layers had to leave the page to find out where any of
 * it happened.
 *
 * The three cross-year figures came from the compare page, which was an
 * axis pretending to be a subject. The year is a control, not a
 * destination, so the figures that contrast layers across the two wars
 * belong beside the layers they contrast.
 */
export default function WhoPage() {
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;

  return (
    <PageShell
      title="Who is doing what?"
      lede={
        <>
          Four principal layers are used throughout this observatory. The
          NGO-and-international layer spans actors with very different
          authority - a UN agency, a multilateral lender and a local NGO are
          not equivalents; expand the named-actor lists and subtypes to see
          the differences.
        </>
      }
    >
      <div className="mt-6">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
          <ActorTabs />
        </Suspense>
      </div>
      <div className="mt-7">
        <ActorTreemap />
      </div>

      {/* How each layer's presence moved between the two wars. */}
      <div className="mt-7">
        <LayerSlopeChart />
      </div>
      {/* The two years side by side, then the difference between them. The
          pair used to sit here and the difference on the home page, which
          split one figure across two routes; the caution prints once, on
          the first of them. */}
      <div className="mt-7">
        <YearHeatmaps />
      </div>
      <div className="mt-7">
        <ChangeHeatmap showCaveat={false} />
      </div>
      <div className="mt-7">
        <StageCompositionChart showCaveat={false} />
      </div>

      <div className="mt-7">
        <ActorStageMatrix />
      </div>
      <div className="mt-7">
        <ActorRegister />
      </div>

      {/*
       * Where the same actors were traced acting. The three figures state
       * what the map can and cannot show, which is the first thing a reader
       * needs from it.
       */}
      <section aria-labelledby="where-traced" className="mt-9">
        <h2 id="where-traced" className="text-h2 font-semibold text-navy">
          Where the traced activity sits
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            [String(locations.regions.length), "regional groupings in the tracking"],
            [String(mappable), "of them can be placed on the map"],
            [String(notMappable), "shown separately - they cannot be located"],
          ].map(([value, label]) => (
            <div key={label} className="card">
              <dt className="figure-number text-h2 font-semibold text-navy">{value}</dt>
              <dd className="text-meta text-text-secondary">{label}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <Suspense fallback={<div className="h-[680px] animate-pulse rounded-md bg-white" />}>
            <LebanonMap />
          </Suspense>
        </div>
        <div className="mt-7">
          {/* The standing geography caution is already printed above the map. */}
          <RegionalComposition showCaveat={false} />
        </div>
      </section>

      <section id="no-national-layer" className="card mt-8 max-w-3xl text-body leading-relaxed">
        <h2 className="text-h2 font-semibold text-navy">
          Why there is no national damage layer
        </h2>
        <p className="mt-2 text-text">
          The 2026 rapid assessments cover two zones - south of the Litani
          (desk-validated) and Beirut-Mount Lebanon (field-checked) - while the
          Bekaa and Baalbek-Hermel, which the war did reach, had no equivalent
          assessment by the cut-off. Merging these partial products into a single
          national damage scale would manufacture a false comparison, so this
          observatory does not map damage estimates onto a shared legend. The
          zone-level figures, each with its comparability badge and
          confirmation method, are on the{" "}
          <a href="/destroyed" className="underline underline-offset-2">damage-data page</a>,
          alongside the four non-additive 2024 building-count tracks.
        </p>
      </section>

      <div className="mt-8">
        <Takeaways
          changed="Official institutions specialised into the programmed chain; international actors moved into governance cells; community energy rotated from physical substitution to humanitarian absorption. Traced 2026 activity concentrated in the same southern arc and Dahieh belt as 2024."
          unchanged="Municipal power: zero traced finance, procurement or oversight roles in both years, with traced presence thinning 19 → 12. The Bekaa and Baalbek-Hermel remained thinly traced in both years, and unassessed in 2026."
          matters="Role clarity without resource transfer reproduces the 2024 cost distribution, and programmes fund what is measured: whoever stands downstream of the missing function pays for it, and localities outside the assessed zones enter any future instrument late and weakly."
        />
      </div>
    </PageShell>
  );
}
