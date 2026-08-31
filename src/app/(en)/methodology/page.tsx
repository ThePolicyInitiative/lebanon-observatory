import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import StateChip from "@/components/StateChip";
import { localeAlternates } from "@/lib/i18n";
import { METHOD_INTRO } from "@/lib/framework";
import { cautionCounts, stageLabel } from "@/lib/vocab";
import { slimRecords } from "@/lib/map-records";
import {
  ActionCategoryCards,
  ActorGroupCards,
  MethodSteps,
  StageNesting,
} from "./MethodSections";

export const metadata: Metadata = {
  alternates: localeAlternates("/methodology"),
  title: "How this tracking was built",
  description:
    "How the tracking behind this observatory was compiled: eight steps from public material to manual confirmation, four actor groups, four action categories, and the discipline that keeps announced money apart from completed work.",
};

/**
 * The statuses entries actually carry, in ladder order, tallied live so
 * the page cannot drift from the tracking the way a hand-typed figure
 * would. These are whole-tracking counts, never split by group.
 */
const STATUS_ORDER = ["formal_mandate", "underway", "procurement", "not_verified"] as const;

const STATUS_GLOSS: Record<(typeof STATUS_ORDER)[number], string> = {
  formal_mandate:
    "A legal or institutional assignment of responsibility. It says who must act, not that anything happened on the ground.",
  underway:
    "Activity traced in public reporting, with no claim about how far it went or whether it finished.",
  procurement:
    "A tender or contracting step initiated. Procedure, not works.",
  not_verified:
    "Public reporting the review could not settle further. Never assumed zero, never assumed done.",
};

function statusTally(): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of slimRecords) {
    m.set(r.implementationStatus, (m.get(r.implementationStatus) ?? 0) + 1);
  }
  return m;
}

/**
 * The depth layer of the site: how the tracking was compiled, what the
 * two frameworks are, where the stages sit inside them, and what the
 * counts do and do not claim. Everything of substance is worded once in
 * framework.ts and vocab.ts and rendered from there; the editorial seams
 * and the count discrepancy are disclosed here rather than smoothed over.
 */
export default function MethodologyPage() {
  const tally = statusTally();
  const total = slimRecords.length;

  return (
    <PageShell
      title="How this tracking was built"
      lede={METHOD_INTRO.en}
      figures={[
        { value: String(total), label: "traced activity entries" },
        { value: "235", label: "actors traced: 105 in 2024, 130 in 2026" },
      ]}
    >
      <section aria-labelledby="steps" className="mt-9">
        <h2 id="steps" className="text-h2 font-semibold text-navy">
          The eight steps
        </h2>
        <MethodSteps locale="en" />
      </section>

      <section aria-labelledby="actor-framework" className="mt-9">
        <h2 id="actor-framework" className="text-h2 font-semibold text-navy">
          The actor framework: four groups
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          Every actor in the tracking belongs to exactly one of these four
          groups. Each group keeps one identity hue across the whole site -
          the small square here is the same colour that marks the group in
          every chart and on the map.
        </p>
        <ActorGroupCards locale="en" />
      </section>

      <section aria-labelledby="action-framework" className="mt-9">
        <h2 id="action-framework" className="text-h2 font-semibold text-navy">
          The action framework: four categories
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          Every traced activity is classified into one of four categories,
          and within it one of eleven subcategories that name the kind of
          work.
        </p>
        <ActionCategoryCards locale="en" />
      </section>

      <section aria-labelledby="stage-mapping" className="mt-9">
        <h2 id="stage-mapping" className="text-h2 font-semibold text-navy">
          How the twelve tracked stages nest in the four categories
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          The tracking predates the four-category frame and traces work at a
          finer grain: twelve operational stages of the response. They nest
          inside the categories rather than replace them. The number beside
          each stage is its fixed position in the tracking&apos;s stage
          order, one to twelve.
        </p>
        <StageNesting locale="en" />
        <p className="mt-4 max-w-3xl note-caution text-meta leading-relaxed text-text-secondary">
          Three of these placements are editorial calls, disclosed here
          rather than smoothed over. The &quot;{stageLabel(2, "en")}&quot;
          stage spans both financial subcategories, financing and
          compensation, and sits in the financial category as one stage.
          &quot;{stageLabel(4, "en")}&quot; sits with damage assessment and
          management because its traced work is reaching and securing
          damaged areas: reopening roads, first response, clearing hazards.
          And &quot;{stageLabel(12, "en")}&quot; sits with strategy and
          coordination because it is work on institutional responsibility,
          not physical works.
        </p>
      </section>

      <section aria-labelledby="status-discipline" className="mt-9">
        <h2 id="status-discipline" className="text-h2 font-semibold text-navy">
          The implementation-status discipline
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          Wherever public reporting allows, an entry carries an
          implementation status, and the discipline around it is strict:
          announced funding is never presented as approved or disbursed
          funding, a procurement step is never presented as completed work,
          and no entry in the whole tracking is marked as completed output -
          that status occurs zero times. Across the{" "}
          {total} entries, only four statuses occur.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((k) => (
            <li key={k} className="card">
              <StateChip status={k} />
              <p className="figure-number mt-2 text-h2 text-navy">
                {tally.get(k) ?? 0}
              </p>
              <p className="mt-1 text-meta leading-relaxed text-text-secondary">
                {STATUS_GLOSS[k]}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="count-flag" className="mt-9">
        <h2 id="count-flag" className="text-h2 font-semibold text-navy">
          What the counts mean
        </h2>
        <p className="mt-2 max-w-3xl note-caution text-meta leading-relaxed text-text-secondary">
          {cautionCounts("en")}
        </p>
        <p className="mt-3 max-w-3xl text-body leading-relaxed text-text-secondary">
          Two counts run through the site and they are not the same count.
          The entry-level tracking holds {total} traced activity entries -
          357 for 2024 and 414 for 2026 - and an actor can carry several
          entries within one stage. The stage matrices count actor-stage
          presence instead: the 2024 stage matrix sums to 343 entries, and
          the seeded 2026 stage matrix sums to 360 while a report-level
          recomputation cites 363 - a three-entry difference that is
          disclosed here and in the chart caveats rather than smoothed over.
        </p>
      </section>

      <p className="mt-9 flex flex-wrap gap-x-5 gap-y-1 text-body">
        <Link
          href="/entries"
          className="font-medium text-blue underline-offset-2 hover:underline"
        >
          Every traced entry, one row each →
        </Link>
      </p>
    </PageShell>
  );
}
