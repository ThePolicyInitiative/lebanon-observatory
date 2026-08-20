import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import LebanonMap from "@/components/map/LebanonMap";
import YearChoropleths from "@/components/map/YearChoropleths";
import RegionalComposition from "@/components/map/RegionalComposition";
import Takeaways from "@/components/Takeaways";

export const metadata: Metadata = {
  title: "Reconstruction map",
  description:
    "Interactive map of traced reconstruction-related activity in Lebanon, 2024 and 2026, by governorate zone, actor layer and value-chain stage.",
};

export default function MapPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          Where traced activity concentrated
        </h1>
      </header>

      <div className="mt-6">
        <Suspense fallback={<div className="h-[680px] animate-pulse rounded-md bg-white" />}>
          <LebanonMap />
        </Suspense>
      </div>

      <div className="mt-10">
        <YearChoropleths />
      </div>

      <div className="mt-10">
        {/* The standing geography caution is already printed above the map. */}
        <RegionalComposition showCaveat={false} />
      </div>

      <section className="mt-8 max-w-3xl card p-5 text-sm leading-relaxed">
        <h2 className="text-sm font-semibold text-[color:var(--color-navy)]">
          Why there is no national damage layer
        </h2>
        <p className="mt-2 text-[color:var(--color-text)]">
          The 2026 rapid assessments cover two zones - south of the Litani
          (desk-validated) and Beirut–Mount Lebanon (field-checked) - while
          the Bekaa, Baalbek-Hermel and the North had no equivalent assessment
          by the cut-off. Merging these partial products into a single
          national damage scale would manufacture a false comparison, so this
          observatory does not map damage estimates onto a shared legend. The
          zone-level figures, each with its comparability badge and
          confirmation method, are on the{" "}
          <a href="/damage" className="underline underline-offset-2">damage-data page</a>,
          alongside the four non-additive 2024 building-count tracks.
        </p>
      </section>

      <div className="mt-12">
        <Takeaways
          changed="Traced 2026 activity concentrated in the same southern arc and Dahieh belt as 2024, with international mentions spreading into camps and national-scale governance work."
          unchanged="The Bekaa, Baalbek-Hermel and the North remained thinly traced in both years - and unassessed in 2026 - so data geography risks becoming financing geography."
          matters="Programmes fund what is measured. Localities outside the assessed zones enter any future financing instrument late and weakly, replicating 2024's geographic inequality by a new mechanism."
        />
      </div>
    </div>
  );
}
