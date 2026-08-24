"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { changeFor, countsFor } from "@/lib/data-client";
import {
  cautionCounts,
  layers,
  stageList,
  stageShortList,
  statusLabel,
  type Locale,
} from "@/lib/vocab";
import type { ActorLayer, RoleRecord } from "@/lib/types";
import { signed } from "@/lib/format";

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
    title: "Direct change in traced presence, 2026 minus 2024",
    subtitle:
      "Teal marks gains in traced actor-stage presence; rust marks contraction; white marks no change. Hover a cell for its value, or click it for the entries behind that change.",
    tipChange: "Change",
    tipClick: "Click for underlying data",
    visualMapText: ["gain (teal)", "contraction (rust)"],
    description:
      "Heatmap of change in traced actor presence between 2024 and 2026 across four actor layers and twelve value-chain stages. The largest gains are community relief (+35) and community coordination (+25); the deepest contractions are community finance (−11) and community rubble clearance (−9).",
    tableCaption: "Change in traced actor-stage presence, 2026 minus 2024.",
    tableHeaders: ["Actor layer", "Stage", "2024", "2026", "Change"],
    chartAria: "Heatmap of change in traced actor presence by layer and stage",
    dialogLabel: (layer: string, stage: string) => `Data for ${layer} in ${stage}`,
    drawerCounts: (y24: number, y26: number) =>
      `${y24} traced in 2024 · ${y26} in 2026 (analysis)`,
    drawerShown: (n: number) => ` · ${n} traced entries shown below`,
    close: "Close",
    loading: "Loading the entries behind this cell…",
    empty:
      "No traced entries map to this cell at function-column grain. The analytical count above is recomputed at entry level from the underlying tracking, which is finer grained than the chart figures by construction.",
  },
  ar: {
    title: "التغيّر المباشر في الحضور المرصود، 2026 ناقص 2024",
    subtitle:
      "الأزرق المخضرّ يعني كسباً في الحضور المرصود بين الجهات والمراحل؛ والصدئ يعني انكماشاً؛ والأبيض يعني لا تغيّر. مرّر المؤشر فوق خلية لقراءة قيمتها، أو انقرها لعرض المدخلات وراء ذلك التغيّر.",
    tipChange: "التغيّر",
    tipClick: "انقر لعرض ما وراء الخلية",
    visualMapText: ["كسب (أزرق مخضرّ)", "انكماش (صدئ)"],
    description:
      "خريطة حرارية للتغيّر في الحضور المرصود للجهات بين 2024 و2026 عبر أربع طبقات فاعلة واثنتي عشرة مرحلة من سلسلة القيمة. أكبر المكاسب إغاثة المجتمع المحلي (+35) وتنسيقه (+25)؛ وأعمق الانكماشات تمويل المجتمع المحلي (-11) ورفع الأنقاض لديه (-9).",
    tableCaption: "التغيّر في الحضور المرصود بين الجهات والمراحل، 2026 ناقص 2024.",
    tableHeaders: ["طبقة الجهة", "المرحلة", "2024", "2026", "التغيّر"],
    chartAria: "خريطة حرارية للتغيّر في الحضور المرصود للجهات بحسب الطبقة والمرحلة",
    dialogLabel: (layer: string, stage: string) => `معطيات ${layer} في ${stage}`,
    drawerCounts: (y24: number, y26: number) =>
      `${y24} مرصوداً في 2024 · ${y26} في 2026 (التحليل)`,
    drawerShown: (n: number) => ` · ${n} من المدخلات المتتبَّعة معروضة أدناه`,
    close: "إغلاق",
    loading: "جارٍ تحميل المدخلات وراء هذه الخلية…",
    empty:
      "لا مدخلات متتبَّعة تقابل هذه الخلية على مستوى عمود الوظيفة. العدد التحليلي أعلاه يُعاد حسابه على مستوى المدخل من التتبّع الأساسي، وهو أدق تفصيلاً من أرقام الرسم بحكم البناء.",
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

  const t = T[locale];
  const layerMeta = layers(locale);
  const stages = stageList(locale);

  useEffect(() => {
    if (cell) closeRef.current?.focus();
  }, [cell]);

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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCell(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data, maxAbs } = useMemo(() => {
    const cells: [number, number, number][] = [];
    const ls = layers("en");
    for (let li = 0; li < ls.length; li++) {
      const change = changeFor(ls[li].id);
      for (let si = 0; si < 12; si++) {
        cells.push([si, li, change[si]]);
      }
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
      grid: { left: 210, right: 20, top: 10, bottom: 90 },
      tooltip: {
        formatter: (p) => {
          const { value } = p as unknown as { value: [number, number, number] };
          const [si, li, v] = value;
          const layer = ls[li];
          const y24 = countsFor(2024, layer.id)[si];
          const y26 = countsFor(2026, layer.id)[si];
          return `<strong>${stageNames[si]}</strong><br/>${layer.label}<br/>2024: ${y24} · 2026: ${y26} · ${tt.tipChange}: <strong>${signed(v)}</strong><br/><em>${tt.tipClick}</em>`;
        },
      },
      xAxis: {
        type: "category",
        data: stageShortList(locale),
        position: "bottom",
        axisLabel: { rotate: 38, fontSize: 10.5 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
      },
      yAxis: {
        type: "category",
        data: ls.map((l) => l.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11.5 },
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
        text: [...tt.visualMapText],
        textStyle: { fontSize: 10 },
        inRange: {
          color: ["#BD5A46", "#E4B3A7", "#FFFFFF", "#9CC7CE", "#1B8295"],
        },
      },
      series: [
        {
          type: "heatmap",
          data,
          // Cells are unlabelled. The change is in the tooltip, in the
          // figure's description and in the drawer a click opens.
          label: { show: false },
          itemStyle: { borderColor: "#FAFAF7", borderWidth: 2 },
          emphasis: {
            itemStyle: { borderColor: "#173B63", borderWidth: 2 },
          },
        },
      ],
    };
  }, [maxAbs, data, locale]);

  const tableRows = layerMeta.flatMap((layer) =>
    stages.map((stage, i) => [
      layer.label,
      stage,
      countsFor(2024, layer.id)[i],
      countsFor(2026, layer.id)[i],
      signed(changeFor(layer.id)[i]),
    ]),
  );

  return (
    <div className="relative">
      <ChartFrame
        id="change-heatmap"
        title={t.title}
        subtitle={t.subtitle}
        caveat={showCaveat ? cautionCounts(locale) : undefined}
        sourceIds={["S-TRACKING"]}
        chartRef={chartRef}
        description={t.description}
        table={{
          caption: t.tableCaption,
          headers: [...t.tableHeaders],
          rows: tableRows,
        }}
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
              openCell(layerMeta[li].id, si + 1);
            },
          }}
        />
      </ChartFrame>

      {cell ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.dialogLabel(
            layerMeta.find((l) => l.id === cell.layer)?.label ?? cell.layer,
            stages[cell.stageNo - 1],
          )}
          className="fixed inset-0 z-[60] flex justify-end bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCell(null);
          }}
        >
          <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--color-border)] p-4">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                  {layerMeta.find((l) => l.id === cell.layer)?.label} ·{" "}
                  {stages[cell.stageNo - 1]}
                </h3>
                <p className="mt-0.5 text-xs text-[color:var(--color-text-secondary)]">
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
                onClick={() => setCell(null)}
                className="min-h-11 min-w-11 rounded border border-[color:var(--color-border)] text-sm"
              >
                <span className="sr-only">{t.close}</span>
                <span aria-hidden>✕</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {records === null ? (
                <p className="text-sm text-[color:var(--color-text-secondary)]">
                  {t.loading}
                </p>
              ) : records.length === 0 ? (
                <p className="text-sm text-[color:var(--color-text-secondary)]">
                  {t.empty}
                </p>
              ) : (
                <ul className="space-y-4">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className="rounded border border-[color:var(--color-border)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[color:var(--color-navy)]">
                          {r.actorName}
                        </p>
                        <span
                          className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white"
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
                      <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
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
                      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text)]">
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
