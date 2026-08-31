import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import ActorTabs from "./ActorTabs";
import GroupCards from "./GroupCards";
import CategoryMix from "./CategoryMix";
import ActorTreemap from "@/components/charts/ActorTreemap";
/**
 * These two were lazily loaded because each pulled the whole register into
 * the browser. They now reduce and project on the server and hand small
 * props to their interactive halves, so a plain import is both simpler and
 * faster - nothing heavy is left to defer.
 */
import ActorStageMatrix from "./ActorStageMatrix";
import ActorRegister from "./ActorRegister";
import ChangeHeatmap from "@/components/charts/ChangeHeatmap";
import StageCompositionChart from "@/components/charts/StageCompositionChart";
import LebanonMap from "@/components/map/LebanonMap";
import RegionalComposition from "@/components/map/RegionalComposition";
import SeeMore from "@/components/SeeMore";
import Takeaways from "@/components/Takeaways";
import { AIM } from "@/lib/framework";
import { locations } from "@/lib/data-client";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/who"),
  title: "Who is doing what?",
  description:
    "Everyone traced acting in Lebanon's two post-war responses, sorted into the report's four groups - who each group includes, what it was traced doing in 2024 and 2026, and the map of where the traced activity sits.",
};

/**
 * Who is doing what.
 *
 * The page follows the report's actor framework: it opens by defining the
 * four groups, goes deep group by group, then reads the groups side by
 * side and the work by kind. Group comparisons are drawn to scale but
 * never numbered; a group's own detail may carry counts, and so may
 * category and stage totals summed across all four groups.
 *
 * The map is on this page rather than in a tab of its own: "map" was
 * never a question a reader arrives with, it is how this one gets drawn -
 * who was present, and where.
 */
export default function WhoPage() {
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;
  const actorFrame = AIM.en.layers.find((l) => l.id === "actors")!;

  return (
    <PageShell title="Who is doing what?" lede={actorFrame.body}>
      {/* The report's actor framework, before any figure built on it. */}
      <GroupCards />

      <section aria-labelledby="group-profiles" className="mt-9">
        <h2 id="group-profiles" className="text-h2 font-semibold text-navy">
          Each group, one at a time
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          Pick a group: who carries it, what each year looked like, and
          where its traced activity widened or narrowed between the wars.
        </p>
        <div className="mt-4">
          <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
            <ActorTabs />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="who-carries-the-work" className="mt-9">
        <h2 id="who-carries-the-work" className="text-h2 font-semibold text-navy">
          Who carries the work
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          One cell per traced actor, sized by its traced activity and
          gathered into the four groups - the whole cast on one canvas.
        </p>
        <div className="mt-4">
          <ActorTreemap />
        </div>
      </section>

      <section aria-labelledby="stages-held" className="mt-9">
        <h2 id="stages-held" className="text-h2 font-semibold text-navy">
          Which groups held each stage of the response
        </h2>
        <div className="mt-4">
          <StageCompositionChart showCaveat={false} />
        </div>
      </section>

      <section aria-labelledby="what-shifted" className="mt-9">
        <h2 id="what-shifted" className="text-h2 font-semibold text-navy">
          What shifted between the two wars
        </h2>
        {/* The one keyboard-walkable grid on the page; the standing counts
            caution prints here, once, under it. */}
        <div className="mt-4">
          <ChangeHeatmap />
        </div>
        <SeeMore label="every traced actor against every stage of the response">
          <ActorStageMatrix />
        </SeeMore>
      </section>

      <CategoryMix />

      <div className="mt-9">
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

      {/* One line: the claim's one home is the damage page. */}
      <section id="no-national-layer" className="card mt-8 max-w-3xl text-body leading-relaxed">
        <h2 className="text-h3 font-semibold text-navy">
          Why there is no national damage layer
        </h2>
        <p className="mt-1 text-text">
          The 2026 assessments cover two zones and cannot be merged into one
          national scale - the zone figures and the full reasoning are on the{" "}
          <a href="/destroyed" className="underline underline-offset-2">damage page</a>.
        </p>
      </section>

      <div className="mt-8">
        <Takeaways
          changed="Community initiatives widened into relief, coordination and shelter work, and the official side formalised into a programmed chain of finance, procurement and oversight around the 2026 plan."
          unchanged="Delivery. Both years stayed concentrated in the work that prepares recovery rather than the work that finishes it, and municipalities kept carrying labour without budgets or authority."
          matters="A clearer structure without resources moves paperwork rather than recovery: whoever stands downstream of a missing function - households first - keeps paying for it."
        />
      </div>
    </PageShell>
  );
}
