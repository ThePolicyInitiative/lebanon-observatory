"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AR_COUNT,
  arabicCount,
  layers,
  stageLabel,
  type Locale,
} from "@/lib/vocab";
import { useRovingRadio } from "@/lib/useRovingRadio";
import type { ActorLayer, Year } from "@/lib/types";
import { CHART } from "@/lib/colors";
import StateChip from "@/components/StateChip";

const T = {
  en: {
    search: "Search actors and actions",
    placeholder: "e.g. rubble, CDR, compensation, Nabatieh",
    layerFilter: "Layer filter",
    yearFilter: "Year filter",
    allLayers: "All layers",
    bothYears: "Both years",
    showing: (a: number, e: number) => [`Showing `, `${a}`, ` actors with `, `${e}`, ` entries under the current filters.`] as const,
    where: "Where:",
    seeMap: "see on the map →",
    none: "No actors match the current filters.",
    stages: (n: number) => `${n} stage${n === 1 ? "" : "s"}`,
    roles: {
      finance: "finance",
      procurement: "procurement",
      implementation: "implementation",
      oversight: "oversight",
    } as Record<string, string>,
  },
  ar: {
    search: "ابحث في الجهات والأفعال",
    placeholder: "مثلاً: أنقاض، مجلس الإنماء، تعويضات، النبطية",
    layerFilter: "ترشيح بالطبقة",
    yearFilter: "ترشيح بالسنة",
    allLayers: "كل الطبقات",
    bothYears: "السنتان",
    showing: (a: number, e: number) =>
      [
        `تُعرض `,
        `${a}`,
        ` ${a <= 10 ? "جهات" : "جهة"} بـ`,
        `${e}`,
        ` ${e <= 10 ? "مدخلات" : "مدخلاً"} ضمن الترشيح الحالي.`,
      ] as const,
    where: "أين:",
    seeMap: "على الخريطة ←",
    none: "لا جهة تطابق الترشيح الحالي.",
    stages: (n: number) => arabicCount(n, AR_COUNT.stage),
    roles: {
      finance: "تمويل",
      procurement: "شراء",
      implementation: "تنفيذ",
      oversight: "رقابة",
    } as Record<string, string>,
  },
} as const;

/**
 * The interactive half of the register. It receives groups already built
 * and projected on the server: the same component used to import the whole
 * of role-records.json, which put every field the register never shows -
 * mandate text, source ids, regions, function columns - into the browser
 * bundle alongside the action text it does show.
 */

/*
 * The status tints that used to live here painted procurement and the
 * two financing statuses in the NGO teal, formal mandate in the official
 * navy, and announced/planned on the municipal amber - three of the four
 * actor layer colours, encoding something that is not an actor layer.
 * One chip row showed official-navy, NGO-teal and community-magenta for
 * year, stage, status and role at once. StateChip draws status as ink.
 */

export type RegisterRecord = {
  id: string;
  year: Year;
  /** The stage label is looked up from stageNo rather than repeated here. */
  stageNo: number;
  implementationStatus: string;
  locationNames: string[];
  /** tracedAction, or the summary where an entry has no action text. */
  action: string;
  /** Which function roles the entry carries, as keys into the locale table. */
  roles: string[];
};

export type RegisterGroup = {
  base: string;
  /** actorAnchor() of the untranslated base name; the same in both languages. */
  anchor: string;
  people: string;
  subtype: string;
  layer: ActorLayer;
  y24: number;
  y26: number;
  stages: number;
  records: RegisterRecord[];
};

export default function RegisterList({ allGroups, locale = "en" }: { allGroups: RegisterGroup[]; locale?: Locale }) {
  const t = T[locale];
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState<"all" | ActorLayer>("all");
  const [year, setYear] = useState<"both" | Year>("both");
  const [open, setOpen] = useState<Set<string>>(new Set());
  /** An anchor waiting for the group it names to be rendered and expanded. */
  const pending = useRef<string | null>(null);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allGroups
      .map((g) => ({
        ...g,
        // The year toggle narrows the entries shown for each actor.
        records: g.records.filter((r) => year === "both" || r.year === year),
      }))
      .filter((g) => {
        if (g.records.length === 0) return false;
        if (layer !== "all" && g.layer !== layer) return false;
        if (!q) return true;
        return (
          g.base.toLowerCase().includes(q) ||
          g.people.toLowerCase().includes(q) ||
          g.subtype.toLowerCase().includes(q) ||
          g.records.some((r) => r.action.toLowerCase().includes(q))
        );
      });
  }, [allGroups, query, layer, year]);

  const shownRecords = groups.reduce((a, g) => a + g.records.length, 0);

  const layerOptions = [
    { id: "all" as const, label: t.allLayers, color: CHART.label },
    ...layers(locale),
  ];
  const layerRoving = useRovingRadio({
    count: layerOptions.length,
    activeIndex: layerOptions.findIndex((l) => l.id === layer),
    onActivate: (i) => setLayer(layerOptions[i].id as "all" | ActorLayer),
  });

  const yearOptions = ["both", 2024, 2026] as const;
  const yearRoving = useRovingRadio({
    count: yearOptions.length,
    activeIndex: yearOptions.findIndex((y) => y === year),
    onActivate: (i) => setYear(yearOptions[i]),
  });

  function toggle(anchor: string) {
    const nowOpen = !open.has(anchor);
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(anchor)) next.delete(anchor);
      else next.add(anchor);
      return next;
    });
    // Opening a group leaves a link to it in the address bar, so a reader
    // who has found an actor can hand that actor to someone else.
    const { pathname, search, hash } = window.location;
    if (nowOpen) {
      window.history.replaceState(null, "", `${pathname}${search}#${anchor}`);
    } else if (hash.slice(1) === anchor) {
      window.history.replaceState(null, "", `${pathname}${search}`);
    }
  }

  /**
   * The hash names one actor group. On load and on any later hash change,
   * that group opens and comes into view; the filters are cleared first,
   * because a link from elsewhere must resolve whatever this page was
   * showing before.
   */
  useEffect(() => {
    const known = new Set(allGroups.map((g) => g.anchor));
    function fromHash() {
      const anchor = decodeURIComponent(window.location.hash.slice(1));
      if (!anchor || !known.has(anchor)) return;
      setQuery("");
      setLayer("all");
      setYear("both");
      setOpen((cur) => (cur.has(anchor) ? cur : new Set(cur).add(anchor)));
      pending.current = anchor;
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [allGroups, pending]);

  /**
   * Scroll once the named group is actually on the page. A hash followed
   * while a filter was hiding that actor resolves on the render after the
   * filters are cleared, which is why this waits for the list to change
   * rather than scrolling from the handler.
   */
  useEffect(() => {
    const anchor = pending.current;
    if (!anchor) return;
    const el = document.getElementById(anchor);
    if (!el) return;
    pending.current = null;
    el.scrollIntoView({ block: "start" });
  }, [groups, open, pending]);

  return (
    <>
      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 sm:max-w-xs">
          <label
            htmlFor="register-search"
            className="block text-micro font-semibold text-text-secondary"
          >
            {t.search}
          </label>
          <input
            id="register-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-white px-2.5 text-body"
          />
        </div>
        <div role="radiogroup" aria-label={t.layerFilter} className="flex flex-wrap gap-1.5">
          {layerOptions.map(
            (l, i) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={layer === l.id}
                {...layerRoving.itemProps(i)}
                onClick={() => setLayer(l.id as "all" | ActorLayer)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 text-micro font-medium transition-colors ${
                  layer === l.id
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-white text-text-secondary hover:text-navy"
                }`}
              >
                <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </button>
            ),
          )}
        </div>
        <div
          role="radiogroup"
          aria-label={t.yearFilter}
          className="inline-flex overflow-hidden rounded-md border border-border bg-white"
        >
          {yearOptions.map((y, i) => (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={year === y}
              {...yearRoving.itemProps(i)}
              onClick={() => setYear(y)}
              className={`min-h-9 px-3 text-micro font-medium ${
                year === y
                  ? "bg-navy text-white"
                  : "text-text-secondary"
              }`}
            >
              {y === "both" ? t.bothYears : y}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-meta text-text-secondary">
        {t.showing(groups.length, shownRecords)[0]}
        <strong className="text-navy">{groups.length}</strong>
        {t.showing(groups.length, shownRecords)[2]}
        <strong className="text-navy">{shownRecords}</strong>
        {t.showing(groups.length, shownRecords)[4]}
      </p>

      {/* Register */}
      <ul className="mt-4 divide-y divide-border border-t border-border">
        {groups.map((g) => {
          const meta = layers(locale).find((l) => l.id === g.layer)!;
          const isOpen = open.has(g.anchor);
          return (
            <li
              key={g.base}
              id={g.anchor}
              className="scroll-mt-[calc(var(--header-h)+0.75rem)]"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(g.anchor)}
                className="flex min-h-12 w-full items-center gap-3 px-1 py-2.5 text-start hover:bg-[#F6F8FA]"
              >
                <span
                  aria-hidden
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-navy">
                    {g.base}
                  </span>
                  <span className="block truncate text-micro text-text-secondary">
                    {g.people ? `${g.people} · ` : ""}
                    {g.subtype}
                  </span>
                </span>
                <span className="hidden shrink-0 gap-1.5 text-micro tabular-nums sm:flex">
                  {g.y24 > 0 && year !== 2026 ? (
                    <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 font-semibold text-y2024-text">
                      2024 × {year === "both" ? g.y24 : g.records.length}
                    </span>
                  ) : null}
                  {g.y26 > 0 && year !== 2024 ? (
                    <span className="rounded-sm bg-[#E8F1EC] px-1.5 py-0.5 font-semibold text-y2026">
                      2026 × {year === "both" ? g.y26 : g.records.length}
                    </span>
                  ) : null}
                  <span className="rounded-sm bg-[#F2F2EF] px-1.5 py-0.5 text-text-secondary">
                    {t.stages(g.stages)}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-text-secondary">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <div className="space-y-3 px-1 pb-4 ps-5">
                  {g.records.map((r) => (
                    <article key={r.id} className="panel-sunken p-3">
                      <p
                        className={`flex flex-wrap items-center gap-1.5 text-micro font-semibold ${
                          locale === "ar" ? "" : "uppercase tracking-wide"
                        }`}
                      >
                        <span
                          className={`rounded-sm px-1.5 py-0.5 ${
                            r.year === 2024
                              ? "bg-[#EEF2F7] text-y2024-text"
                              : "bg-[#E8F1EC] text-y2026"
                          }`}
                        >
                          {r.year}
                        </span>
                        <span className="rounded-sm bg-white px-1.5 py-0.5 text-navy ring-1 ring-border">
                          {r.stageNo}. {stageLabel(r.stageNo, locale)}
                        </span>
                        <StateChip status={r.implementationStatus} locale={locale} />
                        {r.roles.map((key) => (
                          <span
                            key={key}
                            className="rounded-sm bg-[#F4EAF0] px-1.5 py-0.5 text-magenta"
                          >
                            {t.roles[key] ?? key}
                          </span>
                        ))}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-meta leading-relaxed text-text">
                        {r.action}
                      </p>
                      {r.locationNames.length > 0 ? (
                        <p className="mt-2 text-micro text-text-secondary">
                          <span className="font-semibold">{t.where}</span>{" "}
                          {r.locationNames.join("; ")}{" "}
                          <Link
                            href={`${locale === "ar" ? "/ar" : ""}/map?year=${r.year}&layer=${g.layer}&stage=${r.stageNo}`}
                            className="font-medium text-blue underline-offset-2 hover:underline"
                          >
                            {t.seeMap}
                          </Link>
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {groups.length === 0 ? (
        <p className="mt-4 rounded-md bg-[#F6F8FA] px-3 py-4 text-body text-text-secondary">
          {t.none}
        </p>
      ) : null}
    </>
  );
}
