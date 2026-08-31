import {
  ACTOR_GROUPS,
  CATEGORY_ORDER,
  METHOD_STEPS,
  STAGE_CATEGORY,
  actionCategory,
} from "@/lib/framework";
import { LAYER_COLORS } from "@/lib/colors";
import { layers, stageList, type Locale } from "@/lib/vocab";

/**
 * The framework modules of the methodology page, shared by both language
 * routes the way AboutBody is: one structure, two locales. Every word of
 * substance comes from framework.ts and vocab.ts - this file only holds
 * the two tiny sub-labels the cards need, so the prose that argues the
 * page stays inline in each page file, in its own language.
 */

const T = {
  en: {
    includes: "Who this includes",
    roles: "Main traced roles",
  },
  ar: {
    includes: "من تضمّ هذه المجموعة",
    roles: "أبرز الأدوار المرصودة",
  },
} as const;

/** The eight compilation steps as a numbered stepper of cards. */
export function MethodSteps({ locale = "en" }: { locale?: Locale }) {
  return (
    <ol className="mt-4 grid gap-3 md:grid-cols-2">
      {METHOD_STEPS[locale].map((s, i) => (
        <li key={s.title} className="card flex items-start gap-3">
          {/* Decorative: the <ol> already carries the order for readers
              who cannot see the chip. */}
          <span
            aria-hidden="true"
            className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-meta font-bold text-white"
          >
            {i + 1}
          </span>
          <div>
            <h3 className="text-h3 font-semibold text-navy">{s.title}</h3>
            <p className="mt-1.5 text-body leading-relaxed text-text-secondary">
              {s.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * The four actor groups, each under its identity hue. The colour square
 * is identity only - the same hue that marks the group in every chart and
 * on the map - and no group carries a count here, because side by side is
 * exactly where group figures are never printed.
 */
export function ActorGroupCards({ locale = "en" }: { locale?: Locale }) {
  const meta = layers(locale);
  const t = T[locale];
  return (
    <ul className="mt-4 grid gap-3 md:grid-cols-2">
      {ACTOR_GROUPS[locale].map((g) => (
        <li key={g.id} className="card">
          <p className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-text-secondary">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: LAYER_COLORS[g.id] }}
            />
            {meta.find((l) => l.id === g.id)?.short}
          </p>
          <h3 className="mt-1.5 text-h3 font-semibold text-navy">{g.name}</h3>
          <dl className="mt-2 space-y-2">
            <div>
              <dt className="text-meta font-semibold text-text">{t.includes}</dt>
              <dd className="mt-0.5 text-body leading-relaxed text-text-secondary">
                {g.included}
              </dd>
            </div>
            <div>
              <dt className="text-meta font-semibold text-text">{t.roles}</dt>
              <dd className="mt-0.5 text-body leading-relaxed text-text-secondary">
                {g.roles}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

/** The four action categories with their subcategories as definition lists. */
export function ActionCategoryCards({ locale = "en" }: { locale?: Locale }) {
  return (
    <ul className="mt-4 grid gap-3 md:grid-cols-2">
      {CATEGORY_ORDER.map((id) => {
        const c = actionCategory(id, locale);
        return (
          <li key={c.id} className="card">
            <h3 className="text-h3 font-semibold text-navy">{c.name}</h3>
            <dl className="mt-2 space-y-2">
              {c.subcategories.map((s) => (
                <div key={s.name}>
                  <dt className="text-meta font-semibold text-text">{s.name}</dt>
                  <dd className="mt-0.5 text-body leading-relaxed text-text-secondary">
                    {s.scope}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The twelve operational stages sorted into the four categories via
 * STAGE_CATEGORY. The number on each stage is its fixed position in the
 * tracking's stage order, so it is meaningful and stays visible.
 */
export function StageNesting({ locale = "en" }: { locale?: Locale }) {
  const names = stageList(locale);
  return (
    <ul className="mt-4 grid gap-3 md:grid-cols-2">
      {CATEGORY_ORDER.map((id) => {
        const c = actionCategory(id, locale);
        const stages = names
          .map((name, i) => ({ name, no: i + 1 }))
          .filter((s) => STAGE_CATEGORY[s.no - 1] === id);
        return (
          <li key={id} className="card">
            <h3 className="text-h3 font-semibold text-navy">{c.name}</h3>
            <ul className="mt-2 space-y-1.5">
              {stages.map((s) => (
                <li key={s.no} className="flex items-center gap-2 text-body text-text">
                  <span className="figure-number grid h-5 w-5 shrink-0 place-items-center rounded-sm border border-border bg-surface-sunken text-micro text-text-secondary">
                    {s.no}
                  </span>
                  {s.name}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
