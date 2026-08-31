"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { CHART, UI, VALENCE } from "@/lib/colors";
import { changeFor, countsFor } from "@/lib/data-client";
import {
  AR_COUNT,
  arabicCount,
  HEATMAP_STAGES,
  cautionCounts,
  layers,
  stageList,
  stageShortList,
  statusLabel,
  type Locale,
} from "@/lib/vocab";
import type { ActorLayer, RoleRecord } from "@/lib/types";
import { chartText } from "@/lib/chart-style";

/**
 * What the drawer prints for one traced entry. Served as one static JSON
 * per heatmap cell from /cells/{layer}-{stageNo}.json so the browser
 * never downloads the full log; a vitest keeps those files in sync with
 * role-records.json.
 */
type CellEntry = Pick<
  RoleRecord,
  | "id"
  | "year"
  | "actorName"
  | "functionColumn"
  | "implementationStatus"
  | "locationNames"
  | "locationNamesAr"
  | "summary"
  | "summaryAr"
>;

const T = {
  en: {
    title: "Where each group gained or lost traced activity, 2026 vs 2024",
    subtitle:
      "One row per actor group, one column per stage of the response. Teal marks more traced activity in 2026; rust marks less; the pale middle marks about the same. Coordination is left out: nearly every actor touches it, so the column says more about who convenes than about where work sits. Hover a cell for a reading in words, or click it for the entries behind that change.",
    tipClick: "Click for the traced entries behind this cell",
    tipMore: "more traced in 2026",
    tipFewer: "fewer traced in 2026",
    tipSame: "about the same in both years",
    /* The first sentence is pinned by a test ("eleven value-chain
       stages") and stays word for word. The second reads the grid
       qualitatively, because groups compare here and no figure prints. */
    description:
      "Heatmap of change in traced actor presence between 2024 and 2026 across four actor layers and eleven value-chain stages; coordination is left out. The widest gain is community relief, with community shelter and return next; the deepest contractions are community finance and community rubble clearance.",
    tableCaption: "Change in traced activity by group and stage, 2026 minus 2024.",
    tableHeaders: ["Actor group", "Stage", "2024", "2026", "Change"],
    chartAria: "Heatmap of change in traced activity by actor group and stage",
    chartKeys:
      "Interactive change heatmap. While it holds focus, the arrow keys move between cells and Enter opens the traced entries behind the selected cell.",
    dialogLabel: (layer: string, stage: string) => `Traced entries for ${layer} in ${stage}`,
    drawerCounts: (y24: number, y26: number) =>
      `${y24} traced in 2024 · ${y26} in 2026 (analysis)`,
    drawerShown: (n: number) => ` · ${n} traced entries shown below`,
    close: "Close",
    loading: "Loading the entries behind this cell…",
    empty:
      "No traced entries map to this cell at this level of detail. The count above is recomputed at entry level from the underlying tracking, which is finer grained than the chart by construction.",
  },
  ar: {
    title: "أين زاد النشاط المرصود لكل مجموعة أو نقص، 2026 مقابل 2024",
    subtitle:
      "صف لكل مجموعة من الجهات، وعمود لكل مرحلة من الاستجابة. الأزرق المخضرّ يعني نشاطاً مرصوداً أكبر في 2026؛ والصدئ يعني أقل؛ والوسط الباهت يعني على حاله تقريباً. ومرحلة التنسيق خارج الشكل: تكاد كل جهة تمسّها، فعمودها يقول عمّن ينسّق أكثر ممّا يقول أين يقع العمل. مرّر المؤشر فوق خلية لقراءة بالكلمات، أو انقرها لعرض المدخلات وراء ذلك التغيّر.",
    tipClick: "انقر لعرض المدخلات المتتبَّعة وراء هذه الخلية",
    tipMore: "نشاط مرصود أكبر في 2026",
    tipFewer: "نشاط مرصود أقل في 2026",
    tipSame: "على حاله تقريباً في السنتين",
    description:
      "خريطة حرارية للتغيّر في الحضور المرصود للجهات بين 2024 و2026 عبر أربع مجموعات فاعلة وإحدى عشرة مرحلة من مراحل الاستجابة، مع إخراج مرحلة التنسيق. أوسع المكاسب إغاثة المجتمع المحلي، يليها إيواؤه وعودته؛ وأعمق الانكماشات تمويل المجتمع المحلي ورفع الأنقاض لديه.",
    tableCaption: "التغيّر في النشاط المرصود بحسب المجموعة والمرحلة، 2026 ناقص 2024.",
    tableHeaders: ["مجموعة الجهات", "المرحلة", "2024", "2026", "التغيّر"],
    chartAria: "خريطة حرارية للتغيّر في النشاط المرصود بحسب المجموعة والمرحلة",
    chartKeys:
      "خريطة حرارية تفاعلية للتغيّر. ما دامت في بؤرة التركيز، تنقل مفاتيح الأسهم بين الخلايا ويفتح Enter المدخلات المتتبَّعة وراء الخلية المختارة.",
    dialogLabel: (layer: string, stage: string) => `المدخلات المتتبَّعة لـ${layer} في ${stage}`,
    drawerCounts: (y24: number, y26: number) =>
      `${arabicCount(y24, AR_COUNT.entryTraced)} في 2024 · ${y26} في 2026 (التحليل)`,
    drawerShown: (n: number) => ` · ${n} من المدخلات المتتبَّعة معروضة أدناه`,
    close: "إغلاق",
    loading: "جارٍ تحميل المدخلات وراء هذه الخلية…",
    empty:
      "لا مدخلات متتبَّعة تقابل هذه الخلية على هذا المستوى من التفصيل. العدد أعلاه يُعاد حسابه على مستوى المدخل من التتبّع الأساسي، وهو أدق تفصيلاً من الرسم بحكم البناء.",
  },
} as const;

/**
 * Visual 2 - Direct-change heatmap. Rows: four actor layers.
 * Columns: twelve stages. Value: 2026 count minus 2024 count.
 * Clicking a cell opens the underlying actors, actions, locations and citations.
 *
 * `showCaveat` lets a page that already prints the standing counts caution
 * under an earlier figure suppress the repeat here. It defaults to on, so a
 * figure standing alone still carries it.
 */
export default function ChangeHeatmap({
  locale = "en",
  showCaveat = true,
}: { locale?: Locale; showCaveat?: boolean } = {}) {
  const [cell, setCell] = useState<{ layer: ActorLayer; stageNo: number } | null>(null);
  // null while the cell's entries are on their way from /cells/.
  const [records, setRecords] = useState<CellEntry[] | null>(null);
  const requestSeq = useRef(0);
  const chartRef = useRef<ECharts | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  /** The cell the keyboard is on: stage and layer indices into the grid. */
  const focusedCell = useRef({ si: 0, li: 0 });

  const t = T[locale];
  const layerMeta = layers(locale);
  const stages = stageList(locale);

  useEffect(() => {
    if (cell) closeRef.current?.focus();
  }, [cell]);

  /** Closing hands focus back to the chart container the dialog grew from. */
  const close = useCallback(() => {
    setCell(null);
    chartWrapRef.current?.focus();
  }, []);

  function openCell(layer: ActorLayer, stageNo: number) {
    const seq = ++requestSeq.current;
    setCell({ layer, stageNo });
    setRecords(null);
    fetch(`/cells/${layer}-${stageNo}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<CellEntry[]>) : []))
      .catch(() => [] as CellEntry[])
      .then((rows) => {
        if (requestSeq.current !== seq) return;
        setRecords([...rows].sort((a, b) => a.year - b.year));
      });
  }

  useEffect(() => {
    if (!cell) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cell, close]);

  /** Loop Tab and Shift+Tab within the open dialog. */
  function trapTab(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !root.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }

  /** Ring the keyboard cell and surface its value the way hovering does. */
  function highlightCell(si: number, li: number, prev?: { si: number; li: number }) {
    const chart = chartRef.current;
    if (!chart) return;
    if (prev) {
      chart.dispatchAction({
        type: "downplay",
        seriesIndex: 0,
        dataIndex: prev.li * HEATMAP_STAGES.length + prev.si,
      });
    }
    const dataIndex = li * HEATMAP_STAGES.length + si;
    chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex });
    chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex });
  }

  /** Arrow keys walk the grid; Enter opens the cell the walk is on. */
  function onChartKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const { si, li } = focusedCell.current;
    let nsi = si;
    let nli = li;
    switch (e.key) {
      case "ArrowRight":
        // Bounded by the drawn columns, not by the twelve stages that
        // exist. The axis has eleven since coordination was dropped, so the
        // old bound walked one past the end: HEATMAP_STAGES[11] is
        // undefined, Enter then fetched /cells/{layer}-NaN.json and
        // opened a drawer of "undefined".
        nsi = Math.min(HEATMAP_STAGES.length - 1, si + 1);
        break;
      case "ArrowLeft":
        nsi = Math.max(0, si - 1);
        break;
      // The category y-axis puts index 0 at the bottom of the grid.
      case "ArrowUp":
        nli = Math.min(layerMeta.length - 1, li + 1);
        break;
      case "ArrowDown":
        nli = Math.max(0, li - 1);
        break;
      case "Enter":
        e.preventDefault();
        openCell(layerMeta[li].id, HEATMAP_STAGES[si] + 1);
        return;
      default:
        return;
    }
    e.preventDefault();
    focusedCell.current = { si: nsi, li: nli };
    highlightCell(nsi, nli, { si, li });
  }

  /** Leaving the chart clears the keyboard ring and its tooltip. */
  function onChartBlur() {
    const chart = chartRef.current;
    if (!chart) return;
    const { si, li } = focusedCell.current;
    chart.dispatchAction({ type: "downplay", seriesIndex: 0, dataIndex: li * HEATMAP_STAGES.length + si });
    chart.dispatchAction({ type: "hideTip" });
  }

  const { data, maxAbs } = useMemo(() => {
    const cells: [number, number, number][] = [];
    const ls = layers("en");
    for (let li = 0; li < ls.length; li++) {
      const change = changeFor(ls[li].id);
      // x is the drawn position; HEATMAP_STAGES[x] is the stage it means.
      HEATMAP_STAGES.forEach((stageIdx, x) => cells.push([x, li, change[stageIdx]]));
    }
    return {
      data: cells,
      maxAbs: Math.max(...cells.map(([, , v]) => Math.abs(v))),
    };
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const tt = T[locale];
    const ls = layers(locale);
    const stageNames = stageList(locale);
    return {
      grid: { left: 120, right: 20, top: 10, bottom: 90 },
      // Which group, which stage, which way it moved - in words. The
      // figures live behind the click, where a single group's own cell
      // is allowed its granular detail.
      tooltip: {
        formatter: (p) => {
          const { value } = p as unknown as { value: [number, number, number] };
          const [x, li, v] = value;
          // x is the drawn position; map it back to the stage it stands for.
          const si = HEATMAP_STAGES[x];
          const layer = ls[li];
          const word = v > 0 ? tt.tipMore : v < 0 ? tt.tipFewer : tt.tipSame;
          return `<strong>${stageNames[si]}</strong><br/>${layer.label}<br/><strong>${word}</strong><br/><em>${tt.tipClick}</em>`;
        },
      },
      xAxis: {
        type: "category",
        data: HEATMAP_STAGES.map((i) => stageShortList(locale)[i]),
        position: "bottom",
        axisLabel: { rotate: 30, fontSize: chartText(locale).tick, color: "#3D4C5E", margin: 10 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
      },
      yAxis: {
        type: "category",
        // Short layer names: the full ones ate a third of the plot width.
        data: ls.map((l) => l.short),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick, color: "#3D4C5E" },
      },
      visualMap: {
        show: true,
        type: "continuous",
        min: -maxAbs,
        max: maxAbs,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 62,
        itemWidth: 10,
        itemHeight: 90,
        text: [tt.tipMore, tt.tipFewer],
        textStyle: { fontSize: 10 },
        inRange: {
          // Diverging on valence. The positive end was the identity teal,
          // which the actor charts use for the NGO/international layer; it
          // is the growth green now, with a pale tint of each between.
          /* The centre stop was #FFFFFF, the same as the card behind it, so
             a cell that changed by zero was indistinguishable from no cell
             at all - and "no change" is a finding here, not an absence.
             The sunken surface keeps it the quietest stop while still
             being a cell. */
          color: [VALENCE.bad, "#E4B3A7", UI.surfaceSunken, "#A8CBBB", VALENCE.good],
        },
      },
      series: [
        {
          type: "heatmap",
          data,
          // Cells are unlabelled. The change is in the tooltip, in the
          // figure's description and in the drawer a click opens.
          label: { show: false },
          itemStyle: { borderColor: UI.surface, borderWidth: 2 },
          emphasis: {
            itemStyle: { borderColor: "#173B63", borderWidth: 2 },
          },
        },
      ],
    };
  }, [maxAbs, data, locale]);

  return (
    <div className="relative">
      <ChartFrame
        id="change-heatmap"
        title={t.title}
        subtitle={t.subtitle}
        caveat={showCaveat ? cautionCounts(locale) : undefined}
        description={t.description}
      >
        <div
          ref={chartWrapRef}
          tabIndex={0}
          role="application"
          aria-label={t.chartKeys}
          onKeyDown={onChartKeyDown}
          onBlur={onChartBlur}
        >
          <EChart
            option={option}
            height={330}
            ariaLabel={t.chartAria}
            onInit={(c) => {
              chartRef.current = c;
            }}
            onEvents={{
              click: (p) => {
                const params = p as { value?: [number, number, number] };
                if (!params.value) return;
                const [si, li] = params.value;
                openCell(layerMeta[li].id, HEATMAP_STAGES[si] + 1);
              },
            }}
          />
        </div>
      </ChartFrame>

      {cell ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.dialogLabel(
            layerMeta.find((l) => l.id === cell.layer)?.label ?? cell.layer,
            stages[cell.stageNo - 1],
          )}
          ref={dialogRef}
          className="fixed inset-0 z-[60] flex justify-end bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onKeyDown={trapTab}
        >
          <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <h3 className="text-body font-semibold text-navy">
                  {layerMeta.find((l) => l.id === cell.layer)?.label} ·{" "}
                  {stages[cell.stageNo - 1]}
                </h3>
                <p className="mt-0.5 text-meta text-text-secondary">
                  {t.drawerCounts(
                    countsFor(2024, cell.layer)[cell.stageNo - 1],
                    countsFor(2026, cell.layer)[cell.stageNo - 1],
                  )}
                  {records !== null ? t.drawerShown(records.length) : ""}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="min-h-11 min-w-11 rounded border border-border text-body"
              >
                <span className="sr-only">{t.close}</span>
                <span aria-hidden>✕</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {records === null ? (
                <p className="text-body text-text-secondary">
                  {t.loading}
                </p>
              ) : records.length === 0 ? (
                <p className="text-body text-text-secondary">
                  {t.empty}
                </p>
              ) : (
                <ul className="space-y-4">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className="rounded border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-body font-semibold text-navy">
                          {r.actorName}
                        </p>
                        <span
                          className="rounded-sm px-1.5 py-0.5 text-micro font-semibold text-white"
                          style={{
                            background:
                              r.year === 2024
                                ? "var(--color-y2024)"
                                : "var(--color-y2026)",
                          }}
                        >
                          {r.year}
                        </span>
                      </div>
                      <p className="mt-1 text-meta text-text-secondary">
                        {r.functionColumn} ·{" "}
                        {statusLabel(r.implementationStatus, locale)}
                        {(() => {
                          const locs =
                            locale === "ar" && r.locationNamesAr?.length
                              ? r.locationNamesAr
                              : r.locationNames;
                          return locs.length > 0
                            ? ` · ${locs.slice(0, 3).join(locale === "ar" ? "؛ " : "; ")}`
                            : "";
                        })()}
                      </p>
                      <p className="mt-2 text-meta leading-relaxed text-text">
                        {locale === "ar" && r.summaryAr ? r.summaryAr : r.summary}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
