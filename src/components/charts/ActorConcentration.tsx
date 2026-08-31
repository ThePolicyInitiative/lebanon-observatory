import Link from "next/link";
import municipalBodies from "@/data/municipal-bodies.json";
import { actors } from "@/lib/data-client";
import { actorBase, actorLabel } from "@/lib/actor-names";
// From the data-free module, not through ActorRegister: this component
// renders inside a client tree, and the register module carries the whole
// entry log with it.
import { actorHref } from "@/app/(en)/who/actor-anchor";
import {
  AR_COUNT,
  arabicCount,
  cautionCounts,
  layers,
  type Locale,
} from "@/lib/vocab";
import type { ActorLayer } from "@/lib/types";

/**
 * Who carries a layer, and how unevenly.
 *
 * The tab listed named actors with a count beside each, which reads as a
 * roster and hides the shape: in most layers a handful of bodies carry
 * most of the traced entries and a long tail carries one apiece. The bar
 * makes the concentration visible, and the share line states it.
 */

const T = {
  en: {
    title: "Who carries this layer",
    sub: "Traced entries per named actor, each year. Entry counts are traced presence, not importance or delivery.",
    actors: (n: number) => `${n} traced ${n === 1 ? "actor" : "actors"}`,
    top: (n: number, pct: number) => `Top ${n} carry ${pct}% of the layer's entries`,
    more: (n: number) => `Show the remaining ${n}`,
    explorer: "Open these actors in the explorer →",
    none: "No traced actors in this year.",
    namedHeading: "The bodies named by name",
    namedSub:
      "Most of this layer is held as aggregates, because the reporting behind it names no single body. These are the ones it does name. They carry no count here - being named is not a measure of what a body carried.",
    municipalities: "Municipalities",
    unions: "Unions of municipalities",
    inTracking: "in the tracking",
  },
  ar: {
    title: "من يحمل هذه الطبقة",
    sub: "المدخلات المرصودة لكل جهة مسمّاة، في كل سنة. وأعداد المدخلات حضور مرصود، لا أهمية ولا إنجازاً.",
    actors: (n: number) => arabicCount(n, AR_COUNT.actorTraced),
    top: (n: number, pct: number) => `أعلى ${n} جهات تحمل ${pct}% من مدخلات الطبقة`,
    more: (n: number) => `أظهر الـ${n} المتبقية`,
    explorer: "افتح هذه الجهات في المستكشف ←",
    none: "لا جهات مرصودة في هذه السنة.",
    namedHeading: "الجهات المسمّاة بالاسم",
    namedSub:
      "معظم هذه الطبقة محفوظ بصيغة تجميعية، لأن الإبلاغ خلفها لا يسمّي جهة بعينها. وهذه هي التي يسمّيها. ولا تحمل هنا أي عدّ - فالتسمية ليست مقياساً لما حملته الجهة.",
    municipalities: "البلديات",
    unions: "اتحادات البلديات",
    inTracking: "في التتبّع",
  },
} as const;

function YearColumn({
  year,
  layer,
  locale,
}: {
  year: 2024 | 2026;
  layer: ActorLayer;
  locale: Locale;
}) {
  const t = T[locale];
  const list = actors
    // A list of who carries a layer is a list of who carries entries.
    // One catalogued body (CDR in 2026) has none of its own because its
    // 2026 activity is traced under the LEAP project-unit entries, and a
    // zero-length bar beside its name reads as a claim that it did
    // nothing rather than as an artefact of how the entries are named.
    .filter((a) => a.layer === layer && a.year === year && a.recordCount > 0)
    .map((a) => ({
      id: a.id,
      base: actorBase(a.name),
      name: actorLabel(actorBase(a.name), locale),
      count: a.recordCount,
    }))
    .sort((x, y) => y.count - x.count);

  if (list.length === 0)
    return (
      <div>
        <h4 className="text-body font-semibold text-navy">{year}</h4>
        <p className="mt-2 text-meta text-text-secondary">{t.none}</p>
      </div>
    );

  const total = list.reduce((s, a) => s + a.count, 0);
  const max = Math.max(1, ...list.map((a) => a.count));
  const headN = Math.min(5, list.length);
  const headShare = Math.round(
    (list.slice(0, headN).reduce((s, a) => s + a.count, 0) / Math.max(1, total)) * 100,
  );
  const color = year === 2024 ? "var(--color-y2024)" : "var(--color-y2026)";

  const Row = ({ a }: { a: (typeof list)[number] }) => (
    <li key={a.id}>
      <p className="flex items-baseline justify-between gap-2 text-meta">
        {/* A plain anchor, not next/link: this list sits on the actors page
            itself, and a router navigation that changes only the fragment
            never fires hashchange, so the register would not open. */}
        <a
          href={actorHref(a.base, locale)}
          className="min-w-0 truncate text-text underline-offset-2 hover:underline"
          title={a.name}
        >
          {a.name}
        </a>
        <span className="shrink-0 tabular-nums text-text-secondary">
          {a.count}
        </span>
      </p>
      <span
        aria-hidden
        className="mt-0.5 block h-2 rounded-sm"
        style={{ width: `${(a.count / max) * 100}%`, minWidth: 3, background: color }}
      />
    </li>
  );

  return (
    <div>
      <h4 className="flex flex-wrap items-baseline gap-x-2 text-body font-semibold text-navy">
        {year}
        <span className="text-meta font-normal text-text-secondary">
          {t.actors(list.length)}
        </span>
      </h4>
      <p className="mt-0.5 text-meta text-text-secondary">
        {t.top(headN, headShare)}
      </p>
      <ul className="mt-2.5 space-y-2">
        {list.slice(0, 10).map((a) => (
          <Row key={a.id} a={a} />
        ))}
      </ul>
      {list.length > 10 ? (
        <details className="mt-2.5">
          <summary className="cursor-pointer text-meta text-blue underline underline-offset-2">
            {t.more(list.length - 10)}
          </summary>
          <ul className="mt-2.5 space-y-2">
            {list.slice(10).map((a) => (
              <Row key={a.id} a={a} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/**
 * The municipal layer, named.
 *
 * Its entries are mostly aggregates - "Municipalities", "Unions of
 * municipalities" - because the reporting behind them names no single
 * body, and a reader met a layer whose members were all anonymous. The
 * bodies the reporting does name are held in municipal-bodies.json and
 * listed here beside the bars.
 *
 * Deliberately without counts. A named body has no entry total of its
 * own: its activity sits inside an aggregate row, so printing a number
 * next to it would invent a measure the tracking does not hold. The
 * bars above carry the counts; this carries the names.
 */
function NamedMunicipalBodies({ locale }: { locale: Locale }) {
  const t = T[locale];
  const ar = locale === "ar";
  const groups = [
    { label: t.municipalities, rows: municipalBodies.municipalities },
    { label: t.unions, rows: municipalBodies.unions },
  ];
  return (
    <section className="mt-5 border-t border-rule pt-4">
      <h4 className="text-body font-semibold text-navy">{t.namedHeading}</h4>
      <p className="mt-1 text-meta leading-relaxed text-text-secondary">
        {t.namedSub}
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.label}>
            <h5 className="text-micro font-bold uppercase tracking-wide text-text-secondary">
              {g.label}
            </h5>
            <ul className="mt-1.5 space-y-1.5 text-meta">
              {g.rows.map((b) => {
                const row = b as (typeof g.rows)[number] & {
                  role?: string;
                  roleAr?: string;
                };
                const name = ar ? b.nameAr : b.name;
                const head = ar ? b.headAr : b.head;
                const place = ar ? b.placeAr : b.place;
                const role = ar ? row.roleAr : row.role;
                return (
                  <li key={b.name} className="leading-relaxed">
                    {b.url ? (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-text underline underline-offset-2"
                      >
                        {name}
                      </a>
                    ) : (
                      <span className="font-medium text-text">{name}</span>
                    )}
                    {head ? (
                      <span className="text-text-secondary"> - {head}</span>
                    ) : null}
                    <span className="block text-micro text-text-secondary">
                      {b.url ? place : `${place} - ${t.inTracking}`}
                    </span>
                    {role ? (
                      <span className="mt-0.5 block text-micro leading-relaxed text-text-secondary">
                        {role}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ActorConcentration({
  layer,
  locale = "en",
  showCaveat = true,
}: {
  layer: ActorLayer;
  locale?: Locale;
  showCaveat?: boolean;
}) {
  const t = T[locale];
  const meta = layers(locale).find((l) => l.id === layer)!;
  return (
    <figure className="card">
      <figcaption>
        <h3 className="text-lead font-semibold" style={{ color: meta.color }}>
          {t.title}
        </h3>
        <p className="mt-1 text-body text-text-secondary">{t.sub}</p>
      </figcaption>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <YearColumn year={2024} layer={layer} locale={locale} />
        <YearColumn year={2026} layer={layer} locale={locale} />
      </div>
      {layer === "municipal" ? <NamedMunicipalBodies locale={locale} /> : null}

      <p className="mt-3 text-meta">
        <Link
          href={locale === "ar" ? `/ar/entries?layer=${layer}` : `/entries?layer=${layer}`}
          className="text-blue underline underline-offset-2"
        >
          {t.explorer}
        </Link>
      </p>
      {showCaveat ? (
        <p className="mt-2 note-caution text-meta leading-relaxed text-text-secondary">
          {cautionCounts(locale)}
        </p>
      ) : null}
    </figure>
  );
}
