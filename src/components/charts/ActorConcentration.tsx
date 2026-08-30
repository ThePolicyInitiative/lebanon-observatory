import Link from "next/link";
import { actors } from "@/lib/data-client";
import { actorBase, actorLabel } from "@/lib/actor-names";
// From the data-free module, not through ActorRegister: this component
// renders inside a client tree, and the register module carries the whole
// entry log with it.
import { actorHref } from "@/app/(en)/who/actor-anchor";
import { cautionCounts, layers, type Locale } from "@/lib/vocab";
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
    actors: (n: number) => `${n} traced actors`,
    top: (n: number, pct: number) => `Top ${n} carry ${pct}% of the layer's entries`,
    more: (n: number) => `Show the remaining ${n}`,
    explorer: "Open these actors in the explorer →",
    none: "No traced actors in this year.",
  },
  ar: {
    title: "من يحمل هذه الطبقة",
    sub: "المدخلات المرصودة لكل جهة مسمّاة، في كل سنة. وأعداد المدخلات حضور مرصود، لا أهمية ولا إنجازاً.",
    actors: (n: number) => `${n} جهة مرصودة`,
    top: (n: number, pct: number) => `أعلى ${n} جهات تحمل ${pct}% من مدخلات الطبقة`,
    more: (n: number) => `أظهر الـ${n} المتبقية`,
    explorer: "افتح هذه الجهات في المستكشف ←",
    none: "لا جهات مرصودة في هذه السنة.",
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
        <h4 className="text-sm font-semibold text-navy">{year}</h4>
        <p className="mt-2 text-[12.5px] text-text-secondary">{t.none}</p>
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
      <p className="flex items-baseline justify-between gap-2 text-[12.5px]">
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
      <h4 className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-navy">
        {year}
        <span className="text-[12px] font-normal text-text-secondary">
          {t.actors(list.length)}
        </span>
      </h4>
      <p className="mt-0.5 text-[12px] text-text-secondary">
        {t.top(headN, headShare)}
      </p>
      <ul className="mt-2.5 space-y-2">
        {list.slice(0, 10).map((a) => (
          <Row key={a.id} a={a} />
        ))}
      </ul>
      {list.length > 10 ? (
        <details className="mt-2.5">
          <summary className="cursor-pointer text-xs text-blue underline underline-offset-2">
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
        <h3 className="text-base font-semibold" style={{ color: meta.color }}>
          {t.title}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">{t.sub}</p>
      </figcaption>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <YearColumn year={2024} layer={layer} locale={locale} />
        <YearColumn year={2026} layer={layer} locale={locale} />
      </div>
      <p className="mt-3 text-xs">
        <Link
          href={locale === "ar" ? `/ar/entries?layer=${layer}` : `/entries?layer=${layer}`}
          className="text-blue underline underline-offset-2"
        >
          {t.explorer}
        </Link>
      </p>
      {showCaveat ? (
        <p className="mt-2 note-caution text-xs leading-relaxed text-text-secondary">
          {cautionCounts(locale)}
        </p>
      ) : null}
    </figure>
  );
}
