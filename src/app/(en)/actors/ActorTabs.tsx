"use client";

import { layerTotal } from "@/lib/data-client";
import { actors } from "@/lib/data-client";
import { actorBase, actorLabel } from "@/lib/actor-names";
import { actorHref } from "./actor-anchor";
import { useUrlState } from "@/lib/useUrlState";
import { useRovingRadio } from "@/lib/useRovingRadio";
import { layers, type Locale } from "@/lib/vocab";
import type { ActorEntry, ActorLayer } from "@/lib/types";
import { signed } from "@/lib/format";
import { CONTENT, CHANGE_CHARTS, GOVERNANCE_SHIFT } from "./actor-content";
import MunicipalDumbbell from "@/components/charts/MunicipalDumbbell";
import DivergingChangeChart from "@/components/charts/DivergingChangeChart";
import LayerStageProfile from "@/components/charts/LayerStageProfile";
import RegionPresence from "@/components/charts/RegionPresence";
import ActorConcentration from "@/components/charts/ActorConcentration";

const T = {
  en: {
    tablist: "Actor layers",
    presence: (a: number, b: number) =>
      `Traced actor-stage presence: ${a} (2024) → ${b} (2026) · ${signed(b - a)}`,
    profile2024: "2024 profile",
    profile2026: "2026 profile",
    directChange: "Direct change",
    mainGains: "Main gains",
    mainLosses: "Main losses",
    mandateVsAction: "Mandate versus action",
    chainRoles: "Chain roles",
    finance: "Finance",
    procurement: "Procurement",
    implementation: "Implementation",
    onPaperHeading: "On paper versus in practice",
    onPaperIntro:
      "The traced entries, actor by actor, the gap between the mandate an actor holds and the capacity it actually has - the inversion that defines both years.",
    onPaper: "On paper: ",
    inPractice: "In practice: ",
    showAll: (n: number) => `Show all ${n} actors with mandate-and-capacity notes`,
    arrow: "→",
  },
  ar: {
    tablist: "طبقات الجهات الفاعلة",
    presence: (a: number, b: number) =>
      `الحضور المرصود للجهات في المراحل: ${a} (2024) ← ${b} (2026) · ${signed(b - a)}`,
    profile2024: "ملامح 2024",
    profile2026: "ملامح 2026",
    directChange: "التغيّر المباشر",
    mainGains: "أبرز المكاسب",
    mainLosses: "أبرز الخسائر",
    mandateVsAction: "التفويض مقابل الفعل",
    chainRoles: "الأدوار على السلسلة",
    finance: "التمويل",
    procurement: "الشراء",
    implementation: "التنفيذ",
    onPaperHeading: "على الورق مقابل الممارسة",
    onPaperIntro:
      "المدخلات المتتبَّعة، جهةً جهة، للفجوة بين التفويض الذي تمسك به الجهة والقدرة التي تملكها فعلاً - الانقلاب الذي يطبع السنتين.",
    onPaper: "على الورق: ",
    inPractice: "عملياً: ",
    showAll: (n: number) => `إظهار جميع الجهات (${n}) التي تحمل ملاحظات عن التفويض والقدرة`,
    arrow: "←",
  },
} as const;

/** Entries are written "On paper: ... In practice: ..." in English and
    "على الورق: ... عملياً: ..." in Arabic; anything that does not follow
    either shape is printed whole. */
function split(text: string): { onPaper: string | null; inPractice: string | null; raw: string } {
  const m =
    text.match(/on paper:?\s*([\s\S]*?)\s*in practice:?\s*([\s\S]*)/i) ??
    // The Arabic marker requires its colon: without it, letter runs inside
    // ordinary words (e.g. للعمليات) would satisfy the pattern mid-sentence.
    text.match(/على الورق:?\s*([\s\S]*?)\s*عملي(?:اً|ًا)?:\s*([\s\S]*)/);
  if (m) return { onPaper: m[1], inPractice: m[2], raw: text };
  return { onPaper: null, inPractice: null, raw: text };
}

function MandateEntry({ actor, locale }: { actor: ActorEntry; locale: Locale }) {
  const t = T[locale];
  const text =
    locale === "ar"
      ? (actor.mandateVsCapacityAr ?? actor.mandateVsCapacity!)
      : actor.mandateVsCapacity!;
  const s = split(text);
  // The dictionary carries an Arabic name for every traced actor, so the
  // card heading reads in the same language as the note under it.
  const base = actorBase(actor.name);
  return (
    <li className="rounded-md border border-[color:var(--color-border)] p-3.5">
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[color:var(--color-navy)]">
        {/* A plain anchor, not a Link: the register listens for hashchange,
            and a router navigation whose only difference is the fragment
            never fires one. */}
        <a
          href={actorHref(base, locale)}
          className="text-inherit underline-offset-2 hover:underline"
        >
          {actorLabel(base, locale)}
        </a>
        <span
          className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{ background: actor.year === 2024 ? "var(--color-y2024)" : "var(--color-y2026)" }}
        >
          {actor.year}
        </span>
      </p>
      {s.onPaper ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <p className="rounded-sm bg-[#EEF2F7] p-2.5 text-[12.5px] leading-relaxed">
            <span className="font-bold text-[color:var(--color-navy)]">{t.onPaper}</span>
            {s.onPaper}
          </p>
          <p className="rounded-sm bg-[#F7E9E5] p-2.5 text-[12.5px] leading-relaxed">
            <span className="font-bold text-[color:var(--color-rust)]">{t.inPractice}</span>
            {s.inPractice}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[12.5px] leading-relaxed">{s.raw}</p>
      )}
    </li>
  );
}

function MandateVsCapacity({ layer, locale }: { layer: ActorLayer; locale: Locale }) {
  const t = T[locale];
  const entries = actors
    .filter((a) => a.layer === layer && a.mandateVsCapacity)
    .sort((a, b) => a.year - b.year || b.recordCount - a.recordCount);
  if (entries.length === 0) return null;

  return (
    <section className="card p-3.5">
      <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
        {t.onPaperHeading}
      </h3>
      <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
        {t.onPaperIntro}
      </p>
      <ul className="mt-4 space-y-3">
        {entries.slice(0, 6).map((a) => (
          <MandateEntry key={a.id} actor={a} locale={locale} />
        ))}
      </ul>
      {entries.length > 6 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-[color:var(--color-blue)] underline underline-offset-2">
            {t.showAll(entries.length)}
          </summary>
          <ul className="mt-3 space-y-3">
            {entries.slice(6).map((a) => (
              <MandateEntry key={a.id} actor={a} locale={locale} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}



export default function ActorTabs({ locale = "en" }: { locale?: Locale } = {}) {
  const { get, set } = useUrlState({ layer: "official" });
  const layer = (get("layer") as ActorLayer) || "official";
  const t = T[locale];
  const content = CONTENT[layer];
  const layerList = layers(locale);
  const meta = layerList.find((l) => l.id === layer)!;
  const govShift = GOVERNANCE_SHIFT;
  /** Letter-spacing breaks connected Arabic script, so the Arabic page
      keeps these headings unspaced and in their own case. */
  const caps = locale === "ar" ? "" : "uppercase tracking-wide";
  const roving = useRovingRadio({
    count: layerList.length,
    activeIndex: layerList.findIndex((l) => l.id === layer),
    onActivate: (i) => set("layer", layerList[i].id),
  });

  return (
    <div id="actor-layers">
      <div
        role="tablist"
        aria-label={t.tablist}
        className="sticky top-[var(--header-h)] z-40 -mx-4 flex flex-wrap gap-1 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6"
      >
        {layerList.map((l, i) => {
          const active = l.id === layer;
          return (
            <button
              key={l.id}
              role="tab"
              aria-selected={active}
              aria-controls={`tabpanel-${l.id}`}
              id={`tab-${l.id}`}
              {...roving.itemProps(i)}
              onClick={() => set("layer", l.id)}
              className={`min-h-11 rounded-t-md border-b-[3px] px-3.5 text-[13px] transition-colors duration-150 ${
                active
                  ? "font-semibold text-[color:var(--color-navy)]"
                  : "border-transparent text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-navy)]"
              }`}
              style={active ? { borderBottomColor: l.color } : undefined}
            >
              <span
                aria-hidden
                className="me-1.5 inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: l.color }}
              />
              {l.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${layer}`}
        aria-labelledby={`tab-${layer}`}
        className="mt-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-xl font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </h2>
          <p className="text-sm tabular-nums text-[color:var(--color-text-secondary)]">
            {t.presence(layerTotal(2024, layer), layerTotal(2026, layer))}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-md border-t-4 bg-white p-5" style={{ borderTopColor: "var(--color-y2024)" }}>
            <h3 className={`text-sm font-bold text-[color:var(--color-y2024)] ${caps}`}>
              {t.profile2024}
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{content.profile2024[locale]}</p>
          </section>
          <section className="rounded-md border-t-4 bg-white p-5" style={{ borderTopColor: "var(--color-y2026)" }}>
            <h3 className={`text-sm font-bold text-[color:var(--color-y2026)] ${caps}`}>
              {t.profile2026}
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{content.profile2026[locale]}</p>
          </section>
        </div>

        <section className="card p-3.5">
          <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
            {t.directChange}
          </h3>
          <p className="mt-2 text-sm leading-relaxed">{content.directChange[locale]}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className={`text-xs font-bold text-[color:var(--color-teal)] ${caps}`}>
                {t.mainGains}
              </h4>
              <ul className="mt-2 space-y-1.5 text-sm">
                {content.gains.map((g) => (
                  <li key={g.en} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-teal)]" />
                    {g[locale]}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className={`text-xs font-bold text-[color:var(--color-rust)] ${caps}`}>
                {t.mainLosses}
              </h4>
              <ul className="mt-2 space-y-1.5 text-sm">
                {content.losses.map((l) => (
                  <li key={l.en} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-rust)]" />
                    {l[locale]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Every tab: the layer's own shape along the chain. The prose
            above describes it; this is the same claim, drawn. */}
        <LayerStageProfile layer={layer} locale={locale} showCaveat={false} />

        {layer === "municipal" ? <MunicipalDumbbell locale={locale} /> : null}
        {layer === "ngo_international" ? (
          <>
            <DivergingChangeChart
              id={CHANGE_CHARTS.ngo_international.id}
              layer="ngo_international"
              locale={locale}
              title={CHANGE_CHARTS.ngo_international.title[locale]}
              subtitle={CHANGE_CHARTS.ngo_international.subtitle[locale]}
              description={CHANGE_CHARTS.ngo_international.description[locale]}
            />
            <figure className="card p-3.5">
              <figcaption className="text-sm font-semibold text-[color:var(--color-navy)]">
                {govShift.heading[locale]}
              </figcaption>
              <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="rounded-md border border-[color:var(--color-y2024)] p-3 text-sm sm:flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2024)]">2024</p>
                  <p className="mt-1">{govShift.before[locale]}</p>
                </div>
                <span aria-hidden className="self-center text-xl text-[color:var(--color-text-secondary)]">
                  {t.arrow}
                </span>
                <div className="rounded-md border border-[color:var(--color-y2026)] p-3 text-sm sm:flex-[2]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2026)]">2026</p>
                  <p className="mt-1">{govShift.afterIntro[locale]}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {govShift.chips.map((c) => (
                      <li key={c.en} className="rounded-sm bg-[#E8F1F3] px-2 py-0.5 text-xs font-medium text-[color:var(--color-teal)]">
                        {c[locale]}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </figure>
          </>
        ) : null}
        {layer === "community" ? (
          <DivergingChangeChart
            id={CHANGE_CHARTS.community.id}
            layer="community"
            locale={locale}
            title={CHANGE_CHARTS.community.title[locale]}
            subtitle={CHANGE_CHARTS.community.subtitle[locale]}
            description={CHANGE_CHARTS.community.description[locale]}
          />
        ) : null}
        {layer === "official" ? (
          <DivergingChangeChart
            id={CHANGE_CHARTS.official.id}
            layer="official"
            locale={locale}
            title={CHANGE_CHARTS.official.title[locale]}
            subtitle={CHANGE_CHARTS.official.subtitle[locale]}
            description={CHANGE_CHARTS.official.description[locale]}
          />
        ) : null}

        {content.coreFinding ? (
          <p className="rounded-md border-s-4 border-[color:var(--color-navy)] bg-white p-5 text-sm font-medium leading-relaxed">
            {content.coreFinding[locale]}
          </p>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card p-3.5">
            <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
              {t.mandateVsAction}
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{content.mandateVsAction[locale]}</p>
          </div>
          <div className="card p-3.5">
            <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
              {t.chainRoles}
            </h3>
            <dl className="mt-2 space-y-2.5 text-sm">
              <div>
                <dt className="font-semibold text-[color:var(--color-text-secondary)]">{t.finance}</dt>
                <dd className="leading-relaxed">{content.financeRole[locale]}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[color:var(--color-text-secondary)]">{t.procurement}</dt>
                <dd className="leading-relaxed">{content.procurementRole[locale]}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[color:var(--color-text-secondary)]">{t.implementation}</dt>
                <dd className="leading-relaxed">{content.implementationRole[locale]}</dd>
              </div>
            </dl>
          </div>
        </section>

        <MandateVsCapacity layer={layer} locale={locale} />

        <RegionPresence layer={layer} locale={locale} showCaveat={false} />

        <ActorConcentration layer={layer} locale={locale} />
      </div>
    </div>
  );
}
