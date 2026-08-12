"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { timeline } from "@/lib/data-client";
import { fmtDate } from "@/lib/format";

const TRACKS = [
  { id: "conflict", label: "Conflict" },
  { id: "data", label: "Data" },
  { id: "state", label: "State decisions" },
  { id: "finance", label: "Finance" },
  { id: "procurement", label: "Procurement" },
] as const;

const STATUS_STYLE: Record<string, { color: string; symbol: string; label: string }> = {
  completed: { color: "#1B8295", symbol: "circle", label: "Milestone reached" },
  procurement: { color: "#D69600", symbol: "diamond", label: "Process under way" },
  not_verified: { color: "#BD5A46", symbol: "emptyCircle", label: "Not verified / unpaid" },
  context: { color: "#8FA1B5", symbol: "rect", label: "Conflict context" },
};

/**
 * Visual 10 - Commitment-to-delivery timeline: approvals, disbursement and
 * institutional milestones across tracks, with unverified output marked.
 */
export default function DeliveryTimeline() {
  const chartRef = useRef<ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    const data = timeline.map((e) => {
      const s = STATUS_STYLE[e.status];
      return {
        value: [e.date, TRACKS.findIndex((t) => t.id === e.track)],
        name: e.label,
        itemStyle: { color: s.color },
        symbol: s.symbol,
        symbolSize: e.status === "context" ? 9 : 13,
        eventDetail: e.detail,
        eventStatus: s.label,
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
        axisLabel: { fontSize: 10.5, formatter: "{MMM} {yyyy}" },
        splitLine: { show: true, lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "value",
        min: -0.5,
        max: 4.5,
        interval: 1,
        axisLabel: {
          fontSize: 11,
          formatter: (v: number) => TRACKS[Math.round(v)]?.label ?? "",
        },
        splitLine: { lineStyle: { color: "#F3F5F8" } },
      },
      series: [
        {
          type: "scatter",
          data,
          labelLayout: { hideOverlap: true },
          label: {
            show: true,
            position: "top",
            distance: 6,
            fontSize: 9.5,
            color: "#667588",
            formatter: (p) => {
              const name = (p as { name: string }).name;
              return name.length > 34 ? `${name.slice(0, 33)}…` : name;
            },
          },
        },
      ],
    };
  }, []);

  return (
    <div>
      <ChartFrame
        id="delivery-timeline"
        title="From assessment request to (unverified) delivery, Dec 2024 – Jul 2026"
        subtitle="Filled teal circles: milestones reached. Amber diamonds: processes under way. Open rust circles: not verified or unpaid by the cut-off. Grey squares: conflict context."
        caveat="Procurement under way is a process milestone, not data of completed reconstruction. Completed works were not publicly verified by the 31 July 2026 cut-off."
        sourceIds={["S4", "S2", "S20", "S47", "S1", "S7"]}
        chartRef={chartRef}
        description="Timeline scatter across five tracks (conflict, data, state decisions, finance, procurement) from December 2024 to July 2026, showing the 2025 approval cluster, the 2026 procurement publications, first disbursement in May 2026, and the absence of verified completed output at the cut-off."
        table={{
          caption: "Milestones in the commitment-to-delivery chain.",
          headers: ["Date", "Track", "Milestone", "Status", "Detail"],
          rows: timeline.map((e) => [
            fmtDate(e.date),
            TRACKS.find((t) => t.id === e.track)?.label ?? e.track,
            e.label,
            STATUS_STYLE[e.status].label,
            e.detail,
          ]),
        }}
      >
        <EChart
          option={option}
          height={430}
          ariaLabel="Timeline of reconstruction milestones from December 2024 to July 2026"
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
      </ChartFrame>

      <div className="mt-4 rounded-md border border-[color:var(--color-border)] bg-white p-4">
        <h4 className="sr-only">The conversion chain</h4>
        <ol className="flex flex-wrap items-center gap-2 text-[13px]">
          {[
            { label: "Data", status: "done", note: "RDNA + 2026 assessments delivered" },
            { label: "Architecture", status: "done", note: "LEAP effective; CDR unit staffed" },
            { label: "Procurement / delivery", status: "partial", note: "3 packages published, none awarded" },
            { label: "Verified output", status: "missing", note: "Completed output not verified by 31 Jul 2026" },
          ].map((step, i, arr) => (
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
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
