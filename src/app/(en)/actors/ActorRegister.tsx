import { roleRecords } from "@/lib/data";
import RegisterList, { type RegisterGroup } from "./RegisterList";
import { actorAnchor, actorHref } from "./actor-anchor";
import type { Locale } from "@/lib/vocab";
import {
  actorBase,
  actorLabel,
  actorPeople,
  peopleLabel,
  subtypeLabel,
} from "@/lib/actor-names";

/**
 * The per-actor destination, re-exported for any surface that names an
 * actor: actorHref(actorBase(name), locale) is /actors#actor-... in English
 * and /ar/actors#actor-... in Arabic, and the register opens that group.
 *
 * Both live in ./actor-anchor, which carries no data. A client component
 * must import them from there, not through this module, which pulls the
 * whole of role-records.
 */
export { actorAnchor, actorHref };

const HEAD = {
  en: {
    title: "Who did what - the full register",
    lede: "Every traced actor and every traced action, as written in the tracking: the stage it belongs to, its status, its function roles and where it happened. Traced presence is not performance and a mandate is not delivery, so each entry is labelled as exactly what the reporting supports.",
  },
  ar: {
    title: "من فعل ماذا - السجل الكامل",
    lede: "كل جهة مرصودة وكل فعل مرصود، كما وردا في التتبّع: المرحلة التي ينتمي إليها، وحالته، وأدواره الوظيفية، وأين جرى. الحضور المرصود ليس أداءً، والتفويض ليس إنجازاً، لذلك يُوسم كل مدخل بما يدعمه الإبلاغ بالضبط.",
  },
} as const;

/**
 * The full "who did what" register: every traced actor, expandable
 * to its full list of traced actions - stage by stage, with
 * status, function roles and locations, verbatim from the tracking.
 *
 * Grouping and projection happen on the server. The browser gets only the
 * fields the register renders or searches; the mandate text, source ids,
 * regions and function columns stay here.
 */

/** The key travels; RegisterList prints it in the reader's language. */
const ROLE_FIELDS = [
  ["financingRole", "finance"],
  ["procurementRole", "procurement"],
  ["implementationRole", "implementation"],
  ["oversightRole", "oversight"],
] as const satisfies readonly (readonly [string, string])[];

function buildGroups(locale: Locale): RegisterGroup[] {
  const byBase = new Map<string, typeof roleRecords>();
  for (const r of roleRecords) {
    const base = actorBase(r.actorName);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base)!.push(r);
  }
  return [...byBase.entries()]
    .map(([base, records]) => {
      const people =
        records
          .map((r) => actorPeople(r.actorName))
          .filter(Boolean)
          .sort((a, b) => b.length - a.length)[0] ?? "";
      const sorted = [...records].sort((a, b) => a.year - b.year || a.stageNo - b.stageNo);
      return {
        base: actorLabel(base, locale),
        // Off the untranslated name, so both languages anchor alike.
        anchor: actorAnchor(base),
        people: peopleLabel(people, locale),
        subtype: subtypeLabel(records[0].actorSubtype ?? "", locale),
        layer: records[0].actorLayer,
        y24: records.filter((r) => r.year === 2024).length,
        y26: records.filter((r) => r.year === 2026).length,
        stages: new Set(records.map((r) => r.stageNo)).size,
        records: sorted.map((r) => ({
          id: r.id,
          year: r.year,
          stageNo: r.stageNo,
          implementationStatus: r.implementationStatus,
          locationNames:
            locale === "ar" && r.locationNamesAr?.length
              ? r.locationNamesAr
              : r.locationNames,
          // One entry carries no action text of its own; the register has
          // always fallen back to the summary for it. The Arabic register
          // reads the translated twins so entry text matches the page.
          action:
            locale === "ar"
              ? (r.tracedActionAr ?? r.summaryAr ?? r.tracedAction ?? r.summary)
              : (r.tracedAction ?? r.summary),
          roles: ROLE_FIELDS.filter(([field]) => r[field]).map(([, label]) => label),
        })),
      };
    })
    .sort((a, b) => b.records.length - a.records.length);
}

/** Built once per language, at module scope, not per render. */
const ALL_GROUPS: Record<Locale, RegisterGroup[]> = {
  en: buildGroups("en"),
  ar: buildGroups("ar"),
};

export default function ActorRegister({ locale = "en" }: { locale?: Locale } = {}) {
  const h = HEAD[locale];
  return (
    <section aria-labelledby="actor-register" className="card p-3.5 sm:p-4">
      <h2 id="actor-register" className="text-xl font-semibold text-[color:var(--color-navy)]">
        {h.title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        {h.lede}
      </p>
      <RegisterList allGroups={ALL_GROUPS[locale]} locale={locale} />
    </section>
  );
}
