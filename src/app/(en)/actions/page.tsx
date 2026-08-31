import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { Suspense } from "react";
import CategoryMix from "./CategoryMix";
import ActorStageMatrix from "@/app/(en)/actors/ActorStageMatrix";
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
  alternates: localeAlternates("/actions"),
  title: "The action layer",
  description:
    "The action layer of Lebanon's two post-war responses: four categories - financial actions, damage assessment and management, relief and community recovery, and reconstruction and implementation - what was traced under each in 2024 and 2026, and the map of where the actions happened.",
};

/**
 * The action layer: the work itself, read apart from who did it.
 *
 * The page opens on the report's four action categories, then reads the
 * twelve stages inside them - which groups held each stage, and what
 * shifted between the wars. Category and stage counts sum across all
 * four groups, which is why they may be printed here while a group's
 * own totals may not be printed anywhere.
 */
export default function ActionsPage() {
  const actionFrame = AIM.en.layers.find((l) => l.id === "actions")!;
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;

  return (
    <PageShell
      title="The action layer"
      lede={actionFrame.body}
      point="Category and stage counts here sum across all four groups - they measure traced activity, not spending or completed output."
    >
      {/* The report's action framework, before any figure built on it. */}
      <CategoryMix />
      <p className="mt-3 max-w-3xl text-meta leading-relaxed text-text-secondary">
        What each of the four categories covers in full - the eleven
        subcategories and the scope of each - is set out under the{" "}
        <Link
          href="/methodology#action-framework"
          className="font-medium text-blue underline-offset-2 hover:underline"
        >
          action framework
        </Link>{" "}
        on the methodology page.
      </p>

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

      {/*
       * Where the traced actions happened. The three figures state what
       * the map can and cannot show, which is the first thing a reader
       * needs from it. Filter by stage of the response to follow one kind
       * of work across the country.
       */}
      <section aria-labelledby="where-traced" className="mt-9">
        <h2 id="where-traced" className="text-h2 font-semibold text-navy">
          Where the actions happened
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

      <section aria-labelledby="status" className="mt-9">
        <h2 id="status" className="text-h2 font-semibold text-navy">
          Announced is not done
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text">
          Every entry on this page is held to one discipline: announced is
          not approved, and approved is not disbursed. A procurement
          launched is not a work finished, and nothing in either
          year&apos;s tracking is marked completed. How each stage&apos;s
          status is judged is set out under the{" "}
          <Link
            href="/methodology#status-discipline"
            className="font-medium text-blue underline-offset-2 hover:underline"
          >
            status discipline
          </Link>{" "}
          on the methodology page.
        </p>
      </section>

      <div className="mt-8">
        <Takeaways
          changed="The mix of the work itself. 2026 added a programmed chain of financial actions - frameworks, appeals, procurement and oversight - around the government plan, a kind of work the 2024 response barely traced."
          unchanged="Where the work sits. Both years concentrate in the early stages that prepare recovery - assessing, planning, mobilising money - while the implementation stages stay thin in the tracking."
          matters="A response can look busy on paper and still leave streets unrebuilt: until traced work moves down the chain from announcement to delivery, the categories that touch households directly stay the thinnest."
        />
      </div>
    </PageShell>
  );
}
