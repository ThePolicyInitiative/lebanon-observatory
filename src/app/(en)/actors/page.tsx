import type { Metadata } from "next";
import { Suspense } from "react";
import ActorTabs from "./ActorTabs";
import GroupCards from "./GroupCards";
/**
 * This one was lazily loaded because it pulled the whole register into
 * the browser. It now reduces and projects on the server and hands small
 * props to its interactive half, so a plain import is both simpler and
 * faster - nothing heavy is left to defer.
 */
import ActorRegister from "./ActorRegister";
import Takeaways from "@/components/Takeaways";
import { AIM } from "@/lib/framework";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/actors"),
  title: "Who is doing what?",
  description:
    "Everyone traced acting in Lebanon's two post-war responses, sorted into the report's four groups - who each group includes, what it was traced doing in 2024 and 2026, and the full register of who did what.",
};

/**
 * Who is doing what.
 *
 * The page follows the report's actor framework: it opens by defining the
 * four groups, goes deep group by group, then reads the groups side by
 * side. Group comparisons are drawn to scale but never numbered; a
 * group's own detail may carry counts. The work itself - categories,
 * stages and the map of where it happened - lives on /actions, and this
 * page only points there.
 */
export default function WhoPage() {
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

      {/* The category and stage figures moved to /actions with the rest of
          the action layer; a line here keeps the reader from being stranded. */}
      <p className="mt-9 max-w-3xl text-body leading-relaxed text-text">
        How the work itself breaks down - by category and stage - is on the{" "}
        <a href="/actions" className="font-medium text-blue underline-offset-2 hover:underline">
          actions page
        </a>
        .
      </p>

      <div className="mt-9">
        <ActorRegister />
      </div>

      {/* The map is its own section of the site now: it reads across both
          layers, so it stands beside them rather than inside this one. */}
      <p className="mt-9 max-w-3xl text-body leading-relaxed text-text">
        Where each group&apos;s work happened is on the{" "}
        <a href="/map" className="font-medium text-blue underline-offset-2 hover:underline">
          map
        </a>{" "}
        - filter it by actor group to follow one group across the country.
      </p>

      {/* One line: the claim's one home is the damage page. */}
      <section id="no-national-layer" className="card mt-8 max-w-3xl text-body leading-relaxed">
        <h2 className="text-h3 font-semibold text-navy">
          Why there is no national damage layer
        </h2>
        <p className="mt-1 text-text">
          The 2026 assessments cover two zones and cannot be merged into one
          national scale - the zone figures and the full reasoning are under
          the first finding on the{" "}
          <a href="/findings" className="underline underline-offset-2">findings page</a>.
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
