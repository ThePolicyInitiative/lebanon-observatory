import { ACTOR_GROUPS } from "@/lib/framework";
import { layers, type Locale } from "@/lib/vocab";

/**
 * The report's actor framework: the four groups, verbatim from
 * framework.ts - identity chip, name, who the group includes and its
 * main traced roles. Both language pages mount this module, so the two
 * sides cannot diverge on what a group is; the wording itself lives in
 * framework.ts and nowhere else.
 */

const T = {
  en: {
    heading: "The four groups",
    intro:
      "Everyone traced in either response belongs to exactly one of these groups. The colour beside each name marks that group in every figure on this page.",
    includes: "Who this includes",
    roles: "Main traced roles",
  },
  ar: {
    heading: "المجموعات الأربع",
    intro:
      "كل جهة رُصدت في أي من الاستجابتين تنتمي إلى واحدة بالضبط من هذه المجموعات. واللون بجانب كل اسم يميّز تلك المجموعة في كل أشكال هذه الصفحة.",
    includes: "من تضم هذه المجموعة",
    roles: "أبرز الأدوار المرصودة",
  },
} as const;

export default function GroupCards({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const id = locale === "ar" ? "ar-groups" : "groups";
  const colorOf = new Map(layers(locale).map((l) => [l.id, l.color]));
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-h2 font-semibold text-navy">
        {t.heading}
      </h2>
      <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
        {t.intro}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {ACTOR_GROUPS[locale].map((g) => (
          <li key={g.id} className="card">
            <h3 className="flex items-center gap-2 text-body font-semibold text-navy">
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ background: colorOf.get(g.id) }}
              />
              {g.name}
            </h3>
            <dl className="mt-2.5 space-y-2 text-meta leading-relaxed">
              <div>
                <dt className="font-semibold text-text-secondary">{t.includes}</dt>
                <dd className="mt-0.5 text-text">{g.included}</dd>
              </div>
              <div>
                <dt className="font-semibold text-text-secondary">{t.roles}</dt>
                <dd className="mt-0.5 text-text">{g.roles}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
