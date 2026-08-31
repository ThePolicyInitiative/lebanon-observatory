import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import LebanonMap from "@/components/map/LebanonMap";
import RegionalComposition from "@/components/map/RegionalComposition";
import { locations } from "@/lib/data-client";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/map"),
  title: "Where the actions happened",
  description:
    "The map of Lebanon's two post-war responses: every traced action placed where it happened, filterable by year, actor group, stage of the response and status - with the regional composition beside it.",
};

/**
 * The map, as its own section of the site. It reads across both layers -
 * whose action, and what kind - so it stands beside them rather than
 * inside either: filter by group to follow one group's work, or by stage
 * of the response to follow one kind of work across the country.
 *
 * The inner section keeps the `where-traced` id the map carried on its
 * previous homes, so older deep links still land.
 */
export default function MapPage() {
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;

  return (
    <PageShell
      title="Where the actions happened"
      lede="Every traced action, placed where it happened. Filter by year, actor group, stage of the response or status to follow one slice of the work across the country."
    >
      <section aria-labelledby="where-traced" className="mt-8">
        <h2 id="where-traced" className="sr-only">
          The map
        </h2>
        {/* The three figures state what the map can and cannot show, which
            is the first thing a reader needs from it. */}
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
    </PageShell>
  );
}
