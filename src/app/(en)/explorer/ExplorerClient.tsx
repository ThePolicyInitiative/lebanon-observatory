"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ResultProfile from "@/components/charts/ResultProfile";
import Link from "next/link";
import { actors, locations } from "@/lib/data-client";
import { slimRecords, type SlimRecord } from "@/lib/map-records";
import {
  comparabilityLabel,
  layers,
  regionLabel,
  stageLabel,
  stageList,
  statusLabel,
  statusList,
  type Locale,
} from "@/lib/vocab";
import { useUrlState } from "@/lib/useUrlState";
import type { RoleRecord } from "@/lib/types";

/**
 * One entry as /entries/{id}.json serves it: the record, plus its
 * citations already resolved to what they name and where they live, so
 * the drawer never has to print a bare internal id.
 */
type EntryDetail = RoleRecord & {
  citations?: { id: string; label: string; url: string | null }[];
};

/**
 * The explorer runs entirely over the slim projection the map already
 * ships: list, filters and search never need the full log. Only when a
 * row is opened does the drawer fetch that one entry's complete text
 * from /entries/{id}.json - the same static-file pattern the change
 * heatmap uses with /cells/ - so the browser downloads narrative prose
 * one entry at a time instead of all 771 at once.
 *
 * The opened entry lives in the URL beside the filters, so a single
 * traced entry can be sent to someone: /explorer?entry=r2026-12-3 and
 * /ar/explorer?entry=r2026-12-3 both land on that entry's drawer, open,
 * over whatever filter state the rest of the URL carries.
 */

const FUNCTION_COLUMNS = [...new Set(slimRecords.map((r) => r.functionColumn))].sort();
const TOTAL = slimRecords.length;

/** Every reader-facing string on this module, in both languages. */
const T = {
  en: {
    filtersAria: "Data filters",
    filtersSummary: (n: number, m: number) => `Filters (${n} of ${m} entries)`,
    search: "Search",
    searchPlaceholder: "Actor, place, keyword…",
    year: "Year",
    bothYears: "Both years",
    layer: "Actor layer",
    allLayers: "All layers",
    stage: "Value-chain stage",
    allStages: "All stages",
    fn: "Function column",
    allFns: "All functions",
    status: "Implementation status",
    allStatuses: "All statuses",
    region: "Region",
    allRegions: "All regions",
    reset: "Reset all filters",
    shown: (n: number, m: number) => `${n} of ${m} entries shown`,
    tableCaption:
      "traced entries matching the current filters. Each row is one traced actor-function entry; select a row for detail.",
    headers: ["Year", "Actor", "Layer", "Stage", "Location", "Activity", "Status"],
    empty: (m: number) =>
      `No entries match the current filters. Reset the filters to see all ${m} entries.`,
    showMore: (n: number) => `Show more (${n} remaining)`,
    dialogLabel: (name: string) => `entry detail for ${name}`,
    entryRef: "Entry reference",
    close: "Close",
    loadingDetail: "Loading this entry…",
    loadFailed: "This entry could not be loaded.",
    retry: "Try again",
    formalMandate: "Formal mandate",
    tracedAction: "Traced action",
    statusLabel: "Implementation status",
    comparability: "Comparability",
    fnColumn: "Function / sector column",
    locationsLabel: "Locations",
    regionsLabel: "Regions",
    financeRole: "Finance role",
    procurementRole: "Procurement role",
    implementationRole: "Implementation role",
    oversightRole: "Oversight role",
    notSpecified: "Not specified",
    citations: "Citations",
    onPaper: "On paper versus in practice",
    confirmNote:
      "Confirmation note: this entry marks traced presence. It is not proof of expenditure, effectiveness or completed output; statuses above “traced activity” are assigned only where the underlying text supports them.",
    sameActor: (n: number) => `Same actor, other stages (${n})`,
    relatedActors: "Related actors in this stage and year",
    relatedNews: "Related news",
    openCoverage: (s: string) => `Open live coverage tagged “${s}” →`,
    joiner: "; ",
  },
  ar: {
    filtersAria: "مرشّحات المعطيات",
    filtersSummary: (n: number, m: number) => `المرشّحات (${n} من ${m} من المدخلات)`,
    search: "بحث",
    searchPlaceholder: "جهة، مكان، كلمة مفتاحية…",
    year: "السنة",
    bothYears: "السنتان معاً",
    layer: "طبقة الجهة",
    allLayers: "كل الطبقات",
    stage: "مرحلة سلسلة القيمة",
    allStages: "كل المراحل",
    fn: "عمود الوظيفة",
    allFns: "كل الوظائف",
    status: "حالة التنفيذ",
    allStatuses: "كل الحالات",
    region: "المنطقة",
    allRegions: "كل المناطق",
    reset: "إعادة ضبط كل المرشّحات",
    shown: (n: number, m: number) => `${n} من ${m} من المدخلات معروضة`,
    tableCaption:
      "المدخلات المتتبَّعة المطابقة للمرشّحات الحالية. كل صف مدخل واحد لجهة ووظيفة؛ اختر صفاً لعرض التفصيل.",
    headers: ["السنة", "الجهة", "الطبقة", "المرحلة", "الموقع", "النشاط", "الحالة"],
    empty: (m: number) =>
      `لا مدخلات تطابق المرشّحات الحالية. أعد ضبط المرشّحات لعرض المدخلات كلها (${m}).`,
    showMore: (n: number) => `عرض المزيد (${n} متبقياً)`,
    dialogLabel: (name: string) => `تفصيل المدخل: ${name}`,
    entryRef: "مرجع المدخل",
    close: "إغلاق",
    loadingDetail: "جارٍ تحميل هذا المدخل…",
    loadFailed: "تعذّر تحميل هذا المدخل.",
    retry: "أعد المحاولة",
    formalMandate: "التفويض الرسمي",
    tracedAction: "النشاط المتتبَّع",
    statusLabel: "حالة التنفيذ",
    comparability: "القابلية للمقارنة",
    fnColumn: "عمود الوظيفة / القطاع",
    locationsLabel: "المواقع",
    regionsLabel: "المناطق",
    financeRole: "دور تمويلي",
    procurementRole: "دور في الشراء",
    implementationRole: "دور تنفيذي",
    oversightRole: "دور رقابي",
    notSpecified: "غير محدَّد",
    citations: "الإحالات",
    onPaper: "على الورق مقابل الممارسة",
    confirmNote:
      "ملاحظة تأكيد: هذا المدخل يدل على حضور متتبَّع، لا على إنفاق أو فاعلية أو ناتج مكتمل؛ والحالات الأعلى من «نشاط مرصود» لا تُسنَد إلا حيث يدعمها النص الأساسي.",
    sameActor: (n: number) => `الجهة نفسها، مراحل أخرى (${n})`,
    relatedActors: "جهات ذات صلة في هذه المرحلة والسنة",
    relatedNews: "مستجدات ذات صلة",
    openCoverage: (s: string) => `افتح التغطية الحية الموسومة «${s}» ←`,
    joiner: "؛ ",
  },
} as const;

/**
 * One passage of entry text in the page's language where a twin exists,
 * in its own language where none does: an English fallback inside the
 * Arabic page keeps its own direction instead of being bent right-to-left.
 */
function EntryText({
  en,
  arText,
  locale,
  className,
}: {
  en: string | null | undefined;
  arText?: string | null;
  locale: Locale;
  className?: string;
}) {
  const text = locale === "ar" ? (arText ?? en) : en;
  if (!text) return null;
  const foreign = locale === "ar" && !arText;
  return (
    <p className={className} {...(foreign ? { lang: "en", dir: "ltr" as const } : {})}>
      {text}
    </p>
  );
}

export default function ExplorerClient({ locale = "en" }: { locale?: Locale } = {}) {
  const ar = locale === "ar";
  const t = T[locale];
  const layerMeta = layers(locale);
  const stages = stageList(locale);

  const { get, set, reset } = useUrlState({
    year: "all",
    layer: "all",
    stage: "all",
    fn: "all",
    status: "all",
    region: "all",
    q: "",
    // The opened entry, by its own id. Empty means no drawer.
    entry: "",
  });
  /**
   * A sent link arrives with its entry already chosen, so the drawer opens
   * on the first paint rather than a frame later: the id in the URL is read
   * once, as the initial selection. An id that no longer resolves simply
   * yields no selection - a link that outlives an entry still lands on a
   * working explorer rather than an error.
   */
  const [arrivedOn] = useState<SlimRecord | null>(
    () => slimRecords.find((r) => r.id === get("entry")) ?? null,
  );
  const [selected, setSelected] = useState<SlimRecord | null>(arrivedOn);
  // null while the entry's full text is on its way from /entries/.
  const [detail, setDetail] = useState<EntryDetail | null>(null);
  const [detailFailed, setDetailFailed] = useState(false);
  const [visible, setVisible] = useState(50);
  const requestSeq = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** The control that opened the drawer, so closing can hand focus back. */
  const openerRef = useRef<HTMLElement | null>(null);

  /** The request half of loading an entry: nothing is set until it lands. */
  const fetchDetail = useCallback((id: string) => {
    const seq = ++requestSeq.current;
    fetch(`/entries/${id}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<EntryDetail>;
      })
      .then((full) => {
        if (requestSeq.current === seq) setDetail(full);
      })
      .catch(() => {
        if (requestSeq.current === seq) setDetailFailed(true);
      });
  }, []);

  /** Clearing the previous entry's text and asking for the next one. */
  function loadDetail(id: string) {
    setDetail(null);
    setDetailFailed(false);
    fetchDetail(id);
  }

  /**
   * The one fetch no click starts: the entry a reader arrived holding, whose
   * row is already the initial selection above.
   */
  useEffect(() => {
    if (arrivedOn) fetchDetail(arrivedOn.id);
  }, [arrivedOn, fetchDetail]);

  function open(r: SlimRecord, opener?: HTMLElement | null) {
    if (opener) openerRef.current = opener;
    setSelected(r);
    loadDetail(r.id);
    // The opened entry joins the filters in the URL, so this exact drawer
    // has an address that can be sent to someone.
    set("entry", r.id);
  }

  function close() {
    requestSeq.current++;
    // Release the top layer first: while the dialog is modal, everything
    // outside it is inert and the focus restoration below would be a no-op.
    dialogRef.current?.close();
    setSelected(null);
    setDetail(null);
    setDetailFailed(false);
    set("entry", null);
    const opener = openerRef.current;
    openerRef.current = null;
    opener?.focus();
  }

  // showModal() gives the drawer a native focus trap: everything behind
  // the dialog is inert, so Tab can no longer walk out into the page.
  useEffect(() => {
    const d = dialogRef.current;
    if (selected && d && !d.open) d.showModal();
  }, [selected]);

  useEffect(() => {
    if (selected) closeRef.current?.focus();
  }, [selected]);

  /**
   * Search text per entry, prebuilt once so typing stays instant:
   * actor, action (plus its Arabic twin under Arabic), locations in
   * both scripts, and the stage in both its raw and printed names.
   */
  const haystacks = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of slimRecords) {
      const parts = [r.actorName, r.action, r.stage, stageLabel(r.stageNo, locale), ...r.locationNames];
      if (ar) {
        if (r.actionAr) parts.push(r.actionAr);
        if (r.locationNamesAr) parts.push(...r.locationNamesAr);
      }
      m.set(r.id, parts.join(" ").toLowerCase());
    }
    return m;
  }, [ar, locale]);

  const filtered = useMemo(() => {
    const q = get("q").toLowerCase();
    return slimRecords.filter((r) => {
      if (get("year") !== "all" && String(r.year) !== get("year")) return false;
      if (get("layer") !== "all" && r.actorLayer !== get("layer")) return false;
      if (get("stage") !== "all" && String(r.stageNo) !== get("stage")) return false;
      if (get("fn") !== "all" && r.functionColumn !== get("fn")) return false;
      if (get("status") !== "all" && r.implementationStatus !== get("status")) return false;
      if (get("region") !== "all" && !r.regions.includes(get("region"))) return false;
      if (q && !(haystacks.get(r.id) ?? "").includes(q)) return false;
      return true;
    });
  }, [get, haystacks]);

  // Actor identity in the slim projection is the (name, year) pair: the
  // full log's per-year actor ids resolve to exactly that.
  const relatedRecords = selected
    ? slimRecords.filter(
        (r) => r.actorName === selected.actorName && r.year === selected.year && r.id !== selected.id,
      )
    : [];
  const relatedActorNames = selected
    ? [
        ...new Set(
          slimRecords
            .filter(
              (r) =>
                r.stageNo === selected.stageNo &&
                r.year === selected.year &&
                r.actorName !== selected.actorName,
            )
            .map((r) => r.actorName.split(":")[0]),
        ),
      ].slice(0, 8)
    : [];
  const actorEntry = detail ? actors.find((a) => a.id === detail.actorId) : null;
  const mvc = actorEntry
    ? ar
      ? (actorEntry.mandateVsCapacityAr ?? actorEntry.mandateVsCapacity)
      : actorEntry.mandateVsCapacity
    : null;

  const name = (s: string) =>
    ar ? (
      <span lang="en" dir="ltr">
        {s}
      </span>
    ) : (
      s
    );
  const locsFor = (r: SlimRecord) =>
    ar && r.locationNamesAr?.length ? r.locationNamesAr : r.locationNames;

  const selectCls =
    "min-h-11 w-full rounded-md border border-border bg-white px-2.5 text-sm";
  const headingCls =
    "text-xs font-bold uppercase tracking-wide text-text-secondary";

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
      {/* Filter sidebar / sheet */}
      {/* Capped on the aside rather than the inner panel, so the summary
          scrolls with the filters it counts instead of pinning above a
          list that has scrolled away from it. */}
      <aside
        aria-label={t.filtersAria}
        className="lg:sticky lg:top-[var(--header-h)] lg:max-h-[calc(100dvh-var(--header-h))] lg:self-start lg:overflow-y-auto lg:overscroll-contain"
      >
        <details className="rounded-md border border-border bg-white lg:open:pb-4" open>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-navy">
            {t.filtersSummary(filtered.length, TOTAL)}
          </summary>
          <div className="space-y-3 px-4 pb-4">
            <div>
              <label htmlFor="ex-q" className="block text-[11px] font-semibold text-text-secondary">{t.search}</label>
              <input
                id="ex-q"
                type="search"
                defaultValue={get("q")}
                onKeyDown={(e) => { if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value); }}
                onBlur={(e) => set("q", e.target.value)}
                placeholder={t.searchPlaceholder}
                className={selectCls}
              />
            </div>
            <div>
              <label htmlFor="ex-year" className="block text-[11px] font-semibold text-text-secondary">{t.year}</label>
              <select id="ex-year" className={selectCls} value={get("year")} onChange={(e) => set("year", e.target.value)}>
                <option value="all">{t.bothYears}</option>
                <option value="2024">2024</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div>
              <label htmlFor="ex-layer" className="block text-[11px] font-semibold text-text-secondary">{t.layer}</label>
              <select id="ex-layer" className={selectCls} value={get("layer")} onChange={(e) => set("layer", e.target.value)}>
                <option value="all">{t.allLayers}</option>
                {layerMeta.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-stage" className="block text-[11px] font-semibold text-text-secondary">{t.stage}</label>
              <select id="ex-stage" className={selectCls} value={get("stage")} onChange={(e) => set("stage", e.target.value)}>
                <option value="all">{t.allStages}</option>
                {stages.map((s, i) => (
                  <option key={s} value={String(i + 1)}>{i + 1}. {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-fn" className="block text-[11px] font-semibold text-text-secondary">{t.fn}</label>
              <select id="ex-fn" className={selectCls} value={get("fn")} onChange={(e) => set("fn", e.target.value)}>
                <option value="all">{t.allFns}</option>
                {FUNCTION_COLUMNS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-status" className="block text-[11px] font-semibold text-text-secondary">{t.status}</label>
              <select id="ex-status" className={selectCls} value={get("status")} onChange={(e) => set("status", e.target.value)}>
                <option value="all">{t.allStatuses}</option>
                {statusList(locale).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-region" className="block text-[11px] font-semibold text-text-secondary">{t.region}</label>
              <select id="ex-region" className={selectCls} value={get("region")} onChange={(e) => set("region", e.target.value)}>
                <option value="all">{t.allRegions}</option>
                {locations.regions.map((r) => (
                  <option key={r.id} value={r.id}>{regionLabel(r.id, locale)}</option>
                ))}
              </select>
            </div>
            <div className="pt-1">
              <button type="button" onClick={reset} className="min-h-11 w-full rounded-md border border-border bg-white text-sm text-text-secondary">
                {t.reset}
              </button>
            </div>
          </div>
        </details>
      </aside>

      {/* Results */}
      <div className="mt-4 lg:mt-0">
        {/* The filtered count, announced to screen readers as it changes. */}
        <p role="status" aria-live="polite" className="sr-only">
          {t.shown(filtered.length, TOTAL)}
        </p>

        {/* The shape of the current result, above the rows. Narrowing to
            forty entries told you the count and nothing about what the
            forty were; this redraws as the filters move. */}
        <div className="mb-4">
          <ResultProfile rows={filtered} locale={locale} />
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-md border border-border bg-white md:block">
          <table className="min-w-full border-collapse text-[13px]">
            <caption className="sr-only">{t.tableCaption}</caption>
            <thead>
              <tr>
                {t.headers.map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap border-b-2 border-border px-2.5 py-2 text-start font-semibold text-navy">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visible).map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer odd:bg-bg hover:bg-[#EEF2F7]"
                  onClick={(e) => open(r, e.currentTarget.querySelector("button"))}
                >
                  <td className="border-b border-border px-2.5 py-2 tabular-nums">
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[10.5px] font-semibold text-white"
                      style={{ background: r.year === 2024 ? "var(--color-y2024)" : "var(--color-y2026)" }}
                    >
                      {r.year}
                    </span>
                  </td>
                  <td className="max-w-[220px] border-b border-border px-2.5 py-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); open(r, e.currentTarget); }}
                      className="text-start font-medium text-navy underline-offset-2 hover:underline"
                    >
                      {name(r.actorName.split(":")[0])}
                    </button>
                  </td>
                  <td className="border-b border-border px-2.5 py-2">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: layerMeta.find((l) => l.id === r.actorLayer)?.color }} />
                      {layerMeta.find((l) => l.id === r.actorLayer)?.short}
                    </span>
                  </td>
                  <td className="border-b border-border px-2.5 py-2">{stageLabel(r.stageNo, locale)}</td>
                  <td className="max-w-[160px] border-b border-border px-2.5 py-2 text-text-secondary">
                    {locsFor(r).slice(0, 2).join(t.joiner) || "-"}
                  </td>
                  <td className="border-b border-border px-2.5 py-2">
                    {ar ? <span lang="en" dir="ltr">{r.functionColumn}</span> : r.functionColumn}
                  </td>
                  <td className="whitespace-nowrap border-b border-border px-2.5 py-2">{statusLabel(r.implementationStatus, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="space-y-3 md:hidden">
          {filtered.slice(0, visible).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={(e) => open(r, e.currentTarget)}
                className="w-full card p-3.5 text-start"
              >
                <p className="flex items-center justify-between gap-2 text-[11px] text-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: layerMeta.find((l) => l.id === r.actorLayer)?.color }} />
                    {layerMeta.find((l) => l.id === r.actorLayer)?.short}
                  </span>
                  <span
                    className="rounded-sm px-1.5 py-0.5 text-[10.5px] font-semibold text-white"
                    style={{ background: r.year === 2024 ? "var(--color-y2024)" : "var(--color-y2026)" }}
                  >
                    {r.year}
                  </span>
                </p>
                <p className="mt-1 text-sm font-semibold text-navy">{name(r.actorName.split(":")[0])}</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {stageLabel(r.stageNo, locale)} · {ar ? <span lang="en" dir="ltr">{r.functionColumn}</span> : r.functionColumn} · {statusLabel(r.implementationStatus, locale)}
                </p>
              </button>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="card p-3.5 text-sm text-text-secondary">
            {t.empty(TOTAL)}
          </p>
        ) : null}

        {filtered.length > visible ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + 100)}
              className="min-h-11 rounded-md border border-border bg-white px-5 text-sm text-text-secondary hover:border-navy hover:text-navy"
            >
              {t.showMore(filtered.length - visible)}
            </button>
          </div>
        ) : null}
      </div>

      {/* Detail drawer: a native modal dialog, so focus is genuinely
          trapped inside it and handed back to the opening row on close. */}
      {selected ? (
        <dialog
          ref={dialogRef}
          aria-label={t.dialogLabel(selected.actorName)}
          className="fixed inset-0 z-[60] m-0 h-full max-h-none w-full max-w-none justify-end border-0 bg-black/30 p-0 open:flex"
          onCancel={(e) => { e.preventDefault(); close(); }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white text-text shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-text-secondary">
                  {layerMeta.find((l) => l.id === selected.actorLayer)?.label} · {selected.year} · {stageLabel(selected.stageNo, locale)}
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-navy">
                  {name(selected.actorName)}
                </h3>
                {/* The id in the address bar, printed once so an entry can
                    be named in prose and found again from the name. */}
                <p className="mt-1 text-[11px] text-text-secondary">
                  {t.entryRef}:{" "}
                  <span dir="ltr" className="font-mono">
                    {selected.id}
                  </span>
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="min-h-11 min-w-11 rounded border border-border text-sm"
              >
                <span className="sr-only">{t.close}</span>
                <span aria-hidden>✕</span>
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              {/* No "Data summary" block: it is the mandate and the action
                  concatenated, so printing it here showed the same two
                  passages twice. It stays in the data, where the search
                  filter still reads it. */}
              {detailFailed ? (
                <section className="rounded-md bg-bg p-3">
                  <p className="text-[13px] text-text-secondary">{t.loadFailed}</p>
                  <button
                    type="button"
                    onClick={() => loadDetail(selected.id)}
                    className="mt-2 min-h-9 rounded-md border border-border bg-white px-3 text-[13px] text-navy"
                  >
                    {t.retry}
                  </button>
                </section>
              ) : !detail ? (
                <div aria-busy="true" aria-label={t.loadingDetail} className="space-y-2">
                  <p className="text-[13px] text-text-secondary">{t.loadingDetail}</p>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-bg" />
                  <div className="h-4 w-full animate-pulse rounded bg-bg" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-bg" />
                </div>
              ) : (
                <>
                  {detail.formalMandate ? (
                    <section>
                      <h4 className={headingCls}>{t.formalMandate}</h4>
                      <EntryText en={detail.formalMandate} arText={detail.formalMandateAr} locale={locale} className="mt-1 leading-relaxed" />
                    </section>
                  ) : null}
                  {detail.tracedAction ? (
                    <section>
                      <h4 className={headingCls}>{t.tracedAction}</h4>
                      <EntryText en={detail.tracedAction} arText={detail.tracedActionAr} locale={locale} className="mt-1 leading-relaxed" />
                    </section>
                  ) : null}
                  <dl className="grid grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <dt className="font-semibold text-text-secondary">{t.statusLabel}</dt>
                      <dd>{statusLabel(detail.implementationStatus, locale)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-text-secondary">{t.comparability}</dt>
                      <dd>{comparabilityLabel(detail.comparability, locale)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-text-secondary">{t.fnColumn}</dt>
                      <dd>{ar ? <span lang="en" dir="ltr">{detail.functionColumn}</span> : detail.functionColumn}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-text-secondary">{t.locationsLabel}</dt>
                      <dd>
                        {ar && detail.locationNamesAr?.length
                          ? detail.locationNamesAr.join(t.joiner)
                          : detail.locationNames.join(t.joiner) || t.notSpecified}
                      </dd>
                    </div>
                    {detail.regions.length > 0 ? (
                      <div>
                        <dt className="font-semibold text-text-secondary">{t.regionsLabel}</dt>
                        <dd>{detail.regions.map((id) => regionLabel(id, locale)).join(t.joiner)}</dd>
                      </div>
                    ) : null}
                    {detail.financingRole ? (
                      <div>
                        <dt className="font-semibold text-text-secondary">{t.financeRole}</dt>
                        <dd>{ar ? <span lang="en" dir="ltr">{detail.financingRole}</span> : detail.financingRole}</dd>
                      </div>
                    ) : null}
                    {detail.procurementRole ? (
                      <div>
                        <dt className="font-semibold text-text-secondary">{t.procurementRole}</dt>
                        <dd>{ar ? <span lang="en" dir="ltr">{detail.procurementRole}</span> : detail.procurementRole}</dd>
                      </div>
                    ) : null}
                    {detail.implementationRole ? (
                      <div>
                        <dt className="font-semibold text-text-secondary">{t.implementationRole}</dt>
                        <dd>{ar ? <span lang="en" dir="ltr">{detail.implementationRole}</span> : detail.implementationRole}</dd>
                      </div>
                    ) : null}
                    {detail.oversightRole ? (
                      <div>
                        <dt className="font-semibold text-text-secondary">{t.oversightRole}</dt>
                        <dd>{ar ? <span lang="en" dir="ltr">{detail.oversightRole}</span> : detail.oversightRole}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {detail.citations && detail.citations.length > 0 ? (
                    <section>
                      <h4 className={headingCls}>{t.citations}</h4>
                      {/* What is being cited, by name and link. The ids
                          themselves mean nothing outside the compilation. */}
                      <ul className="mt-1 space-y-1">
                        {detail.citations.map((c) => (
                          <li key={c.id} className="text-[12.5px] leading-snug">
                            {c.url ? (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue underline underline-offset-2"
                              >
                                {c.label} <span aria-hidden dir="ltr">↗</span>
                              </a>
                            ) : (
                              c.label
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {mvc ? (
                    <section className="rounded-md bg-bg p-3">
                      <h4 className={headingCls}>{t.onPaper}</h4>
                      <EntryText
                        en={actorEntry?.mandateVsCapacity}
                        arText={actorEntry?.mandateVsCapacityAr}
                        locale={locale}
                        className="mt-1 text-[13px] leading-relaxed"
                      />
                    </section>
                  ) : null}
                  <section>
                    <p className="text-xs text-text-secondary">{t.confirmNote}</p>
                  </section>
                </>
              )}
              {relatedRecords.length > 0 ? (
                <section>
                  <h4 className={headingCls}>{t.sameActor(relatedRecords.length)}</h4>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {relatedRecords.slice(0, 8).map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => open(r)}
                          className="rounded-sm bg-bg px-2 py-1 text-xs hover:bg-[#EEF2F7]"
                        >
                          {stageLabel(r.stageNo, locale)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {relatedActorNames.length > 0 ? (
                <section>
                  <h4 className={headingCls}>{t.relatedActors}</h4>
                  <p
                    className="mt-1 text-[13px] text-text-secondary"
                    {...(ar ? { lang: "en", dir: "ltr" as const } : {})}
                  >
                    {relatedActorNames.join("; ")}
                  </p>
                </section>
              ) : null}
              <section>
                <h4 className={headingCls}>{t.relatedNews}</h4>
                <p className="mt-1 text-[13px]">
                  <Link
                    href={`${ar ? "/ar" : ""}/news?stage=${encodeURIComponent(selected.stage)}`}
                    className="text-blue underline underline-offset-2"
                  >
                    {t.openCoverage(stageLabel(selected.stageNo, locale))}
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
