"use client";

import { useMemo, useRef } from "react";
import type { Locale } from "@/lib/vocab";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { timeline } from "@/lib/data-client";
import { fmtDate } from "@/lib/format";
import { CHART, UI } from "@/lib/colors";
import { chartText } from "@/lib/chart-style";

const TRACKS = [
  { id: "conflict", label: "Conflict", labelAr: "الحرب" },
  { id: "data", label: "Data", labelAr: "المعطيات" },
  { id: "state", label: "State decisions", labelAr: "قرارات الدولة" },
  { id: "finance", label: "Finance", labelAr: "التمويل" },
  { id: "procurement", label: "Procurement", labelAr: "الشراء" },
] as const;

const STATUS_STYLE: Record<
  string,
  { color: string; symbol: string; label: string; labelAr: string }
> = {
  completed: {
    color: UI.teal,
    symbol: "circle",
    label: "Milestone reached",
    labelAr: "محطة بلغت",
  },
  procurement: {
    color: "#D69600",
    symbol: "diamond",
    label: "Process under way",
    labelAr: "مسار جارٍ",
  },
  not_verified: {
    color: UI.rust,
    symbol: "emptyCircle",
    label: "Not confirmed / unpaid",
    labelAr: "غير مؤكَّد أو غير مدفوع",
  },
  context: {
    color: "#8FA1B5",
    symbol: "rect",
    label: "Conflict context",
    labelAr: "سياق الحرب",
  },
};

/**
 * Visual 10 - Commitment-to-delivery timeline: approvals, disbursement and
 * institutional milestones across tracks, with unconfirmed output marked.
 */
const T = {
  en: {
    title: "From assessment request to (unconfirmed) delivery, Dec 2024 – Jul 2026",
    sub: "Filled teal circles: milestones reached. Amber diamonds: processes under way. Open rust circles: not confirmed or unpaid by the cut-off. Grey squares: conflict context.",
    caveat:
      "Procurement under way is a process milestone, not data of completed reconstruction. Completed works were not publicly confirmed by the 31 July 2026 cut-off.",
    description:
      "Timeline scatter across five tracks (conflict, data, state decisions, finance, procurement) from December 2024 to July 2026, showing the 2025 approval cluster, the 2026 procurement publications, first disbursement in May 2026, and the absence of confirmed completed output at the cut-off.",
    alt: "Timeline of reconstruction milestones from December 2024 to July 2026",
    chainHead: "The conversion chain",
    chain: [
      ["Data", "RDNA + 2026 assessments delivered"],
      ["Architecture", "LEAP effective; CDR unit staffed"],
      ["Procurement / delivery", "3 packages published, none awarded"],
      ["Confirmed output", "Completed output not confirmed by 31 Jul 2026"],
    ],
  },
  ar: {
    title: "من طلب التقييم إلى الإنجاز (غير المؤكَّد)، كانون الأول 2024 - تموز 2026",
    sub: "دوائر فيروزية ممتلئة: محطات بلغت. معينات كهرمانية: مسارات جارية. دوائر خمرية مفرغة: غير مؤكَّدة أو غير مدفوعة حتى تاريخ التوقف. مربعات رمادية: سياق الحرب.",
    caveat:
      "الشراء الجاري محطة إجرائية، لا معطى عن إعادة إعمار مكتملة. ولم تُعلَن أي أشغال مكتملة ومؤكَّدة حتى تاريخ التوقف في 31 تموز 2026.",
    description:
      "رسم نقطي زمني على خمسة مسارات (الحرب، المعطيات، قرارات الدولة، التمويل، الشراء) من كانون الأول 2024 إلى تموز 2026، يُظهر تجمّع الإقرارات في 2025، وإعلانات الشراء في 2026، وأول دفعة في أيار 2026، وغياب إنجاز مكتمل مؤكَّد حتى تاريخ التوقف.",
    alt: "جدول زمني لمحطات إعادة الإعمار من كانون الأول 2024 إلى تموز 2026",
    chainHead: "سلسلة التحوّل",
    chain: [
      ["المعطيات", "تقييم RDNA وتقييمات 2026 أُنجزت"],
      ["البنية", "LEAP نافذ؛ وحدة مجلس الإنماء والإعمار مجهَّزة"],
      ["الشراء والتنفيذ", "3 حزم منشورة، ولا إرساء"],
      ["الإنجاز المؤكَّد", "لا إنجاز مكتمل مؤكَّد حتى 31 تموز 2026"],
    ],
  },
} as const;

export default function DeliveryTimeline({ locale = "en" }: { locale?: Locale } = {}) {  const tr = T[locale];
  const chartRef = useRef<ECharts | null>(null);

  const ar = locale === "ar";
  const option = useMemo<EChartsOption>(() => {
    // Alternate each track's labels above and below its line: with every
    // label sitting on top, neighbouring names overprinted each other.
    const seenPerTrack = new Map<number, number>();
    const data = timeline.map((e) => {
      const s = STATUS_STYLE[e.status];
      const trackIndex = TRACKS.findIndex((t) => t.id === e.track);
      const nth = seenPerTrack.get(trackIndex) ?? 0;
      seenPerTrack.set(trackIndex, nth + 1);
      return {
        value: [e.date, trackIndex],
        name: ar ? e.labelAr : e.label,
        itemStyle: { color: s.color },
        symbol: s.symbol,
        symbolSize: e.status === "context" ? 9 : 13,
        label: { position: nth % 2 === 0 ? ("top" as const) : ("bottom" as const) },
        eventDetail: ar ? e.detailAr : e.detail,
        eventStatus: ar ? s.labelAr : s.label,
        eventDate: e.date,
      };
    });
    return {
      grid: { left: 110, right: 30, top: 20, bottom: 70 },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const d = p as unknown as {
            name: string;
            data: { eventDetail: string; eventStatus: string; eventDate: string };
          };
          return `<strong>${d.name}</strong><br/><span style="font-size:11px">${fmtDate(
            d.data.eventDate,
            locale,
          )} · ${d.data.eventStatus}</span>${
            d.data.eventDetail
              ? `<br/><span style="font-size:11px;max-width:280px;display:inline-block;white-space:normal">${d.data.eventDetail}</span>`
              : ""
          }`;
        },
      },
      xAxis: {
        type: "time",
        min: "2024-09-01",
        max: "2026-08-15",
        inverse: ar,
        axisLabel: { fontSize: chartText(locale).tick, formatter: "{MMM} {yyyy}" },
        splitLine: { show: true, lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "value",
        min: -0.5,
        max: 4.5,
        interval: 1,
        position: ar ? "right" : "left",
        axisLabel: {
          fontSize: chartText(locale).tick,
          formatter: (v: number) => {
            const t = TRACKS[Math.round(v)];
            return t ? (ar ? t.labelAr : t.label) : "";
          },
        },
        splitLine: { lineStyle: { color: "#F3F5F8" } },
      },
      series: [
        {
          type: "scatter",
          data,
          // Alternating per-point positions above; anything that still
          // collides is hidden rather than overprinted - the tooltip and
          // the description carry every name.
          labelLayout: { hideOverlap: true },
          label: {
            show: true,
            position: "top",
            distance: 7,
            fontSize: 9.5,
            color: CHART.label,
            formatter: (p) => {
              const name = (p as { name: string }).name;
              return name.length > 28 ? `${name.slice(0, 27)}…` : name;
            },
          },
        },
      ],
    };
  }, [ar, locale]);

  return (
    <div>
      <ChartFrame
        id="delivery-timeline"
        title={tr.title}
        subtitle={tr.sub}
        caveat={tr.caveat}
        sourceIds={["S4", "S2", "S20", "S47", "S1", "S7"]}
        chartRef={chartRef}
        description={tr.description}
        table={{
          caption: tr.chainHead,
          headers: ["Date", "Track", "Milestone", "Status", "Detail"],
          rows: timeline.map((e) => [
            fmtDate(e.date, locale),
            (() => {
              const t = TRACKS.find((x) => x.id === e.track);
              return t ? (ar ? t.labelAr : t.label) : e.track;
            })(),
            ar ? e.labelAr : e.label,
            ar ? STATUS_STYLE[e.status].labelAr : STATUS_STYLE[e.status].label,
            ar ? e.detailAr : e.detail,
          ]),
        }}
      >
        <EChart
          option={option}
          height={430}
          ariaLabel={tr.alt}
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
      </ChartFrame>

      <div className="mt-4 card p-3.5">
        <h4 className="sr-only">{tr.chainHead}</h4>
        <ol className="flex flex-wrap items-center gap-2 text-[13px]">
          {(["done", "done", "partial", "missing"] as const)
            .map((status, i) => ({ status, label: tr.chain[i][0], note: tr.chain[i][1] }))
            .map((step, i, arr) => (
            <li key={step.label} className="flex items-center gap-2">
              <span
                className={`rounded-sm px-2.5 py-1.5 font-medium ${
                  step.status === "done"
                    ? "bg-[#E8F1F3] text-[color:var(--color-teal)]"
                    : step.status === "partial"
                      ? "bg-[#FAF3E3] text-[#8a6200]"
                      : "border border-dashed border-[color:var(--color-rust)] text-[color:var(--color-rust)]"
                }`}
              >
                {step.label}
                <span className="mt-0.5 block text-[10.5px] font-normal opacity-90">
                  {step.note}
                </span>
              </span>
              {i < arr.length - 1 ? (
                <span aria-hidden className="text-[color:var(--color-text-secondary)]">
                  {ar ? "←" : "→"}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
