import { roleRecords } from "@/lib/data";
import RegisterList, { type RegisterGroup } from "./RegisterList";

/**
 * The full "who did what" register: every traced actor, expandable
 * to its full list of traced actions - stage by stage, with
 * status, function roles and locations, verbatim from the tracking.
 *
 * Grouping and projection happen on the server. The browser gets only the
 * fields the register renders or searches; the mandate text, source ids,
 * regions and function columns stay here.
 */

const ROLE_FIELDS = [
  ["financingRole", "finance"],
  ["procurementRole", "procurement"],
  ["implementationRole", "implementation"],
  ["oversightRole", "oversight"],
] as const;

function buildGroups(): RegisterGroup[] {
  const byBase = new Map<string, typeof roleRecords>();
  for (const r of roleRecords) {
    const base = r.actorName.split(":")[0].trim();
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base)!.push(r);
  }
  return [...byBase.entries()]
    .map(([base, records]) => {
      const people =
        records
          .map((r) => r.actorName.split(":").slice(1).join(":").trim())
          .filter(Boolean)
          .sort((a, b) => b.length - a.length)[0] ?? "";
      const sorted = [...records].sort((a, b) => a.year - b.year || a.stageNo - b.stageNo);
      return {
        base,
        people,
        subtype: records[0].actorSubtype ?? "",
        layer: records[0].actorLayer,
        y24: records.filter((r) => r.year === 2024).length,
        y26: records.filter((r) => r.year === 2026).length,
        stages: new Set(records.map((r) => r.stageNo)).size,
        records: sorted.map((r) => ({
          id: r.id,
          year: r.year,
          stageNo: r.stageNo,
          implementationStatus: r.implementationStatus,
          locationNames: r.locationNames,
          // One entry carries no action text of its own; the register has
          // always fallen back to the summary for it.
          action: r.tracedAction ?? r.summary,
          roles: ROLE_FIELDS.filter(([field]) => r[field]).map(([, label]) => label),
        })),
      };
    })
    .sort((a, b) => b.records.length - a.records.length);
}

const ALL_GROUPS = buildGroups();

export default function ActorRegister() {
  return (
    <section aria-labelledby="actor-register" className="card p-4 sm:p-6">
      <h2 id="actor-register" className="text-xl font-semibold text-[color:var(--color-navy)]">
        Who did what - the full register
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        Every traced actor and every traced action, as written in the
        tracking: the stage it belongs to, its status, its function roles and
        where it happened. Traced presence is not performance and a mandate
        is not delivery, so each entry is labelled as exactly what the
        sources support.
      </p>
      <RegisterList allGroups={ALL_GROUPS} />
    </section>
  );
}
