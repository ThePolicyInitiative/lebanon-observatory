import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import LebanonMap from "@/components/map/LebanonMap";
import RegionalComposition from "@/components/map/RegionalComposition";
import PageShell from "@/components/PageShell";
import Takeaways from "@/components/Takeaways";
import { locations } from "@/lib/data-client";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: localeAlternates("/map"),
  title: "Reconstruction map",
  description:
    "Interactive map of traced reconstruction-related activity in Lebanon, 2024 and 2026, by governorate zone, actor layer and value-chain stage.",
};

export default function MapPage() {
  /*
   * The same three figures the Arabic page has carried alone, from the same
   * data. They say what the map can and cannot show, which is the first
   * thing a reader needs from it - there was no reason only one language
   * got them.
   */
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;

  return (
    <PageShell
      title="Where traced activity concentrated"
      figures={[
        { value: String(locations.regions.length), label: "regional groupings in the tracking" },
        { value: String(mappable), label: "of them can be placed on the map" },
        { value: String(notMappable), label: "shown separately - they cannot be located" },
      ]}
    >
      <div className="mt-6">
        <Suspense fallback={<div className="h-[680px] animate-pulse rounded-md bg-white" />}>
          <LebanonMap />
        </Suspense>
      </div>

      <div className="mt-7">
        {/* The standing geography caution is already printed above the map. */}
        <RegionalComposition showCaveat={false} />
      </div>

      <section id="no-national-layer" className="mt-8 max-w-3xl card p-3.5 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold text-navy">
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
          <a href="/damage" className="underline underline-offset-2">damage-data page</a>,
          alongside the four non-additive 2024 building-count tracks.
        </p>
      </section>

      <div className="mt-8">
        <Takeaways
          changed="Traced 2026 activity concentrated in the same southern arc and Dahieh belt as 2024, with international mentions spreading into camps and national-scale governance work."
          unchanged="The Bekaa and Baalbek-Hermel remained thinly traced in both years - and unassessed in 2026 - so data geography risks becoming financing geography."
          matters="Programmes fund what is measured. Localities outside the assessed zones enter any future financing instrument late and weakly, replicating 2024's geographic inequality by a new mechanism."
        />
      </div>
    </PageShell>
  );
}
