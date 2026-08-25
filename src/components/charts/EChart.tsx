"use client";

import { useEffect, useRef } from "react";
import { init, use as register } from "echarts/core";
import {
  BarChart,
  LineChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  CustomChart,
} from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsOption, ECharts } from "echarts";
import { UI } from "@/lib/colors";

// Only what the site draws. A new series or option component must be
// registered here or the chart renders empty.
register([
  BarChart,
  LineChart,
  ScatterChart,
  HeatmapChart,
  TreemapChart,
  CustomChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  SVGRenderer,
]);

type Props = {
  option: EChartsOption;
  height?: number;
  ariaLabel: string;
  onEvents?: Record<string, (params: unknown) => void>;
  onInit?: (chart: ECharts) => void;
  className?: string;
};

/**
 * Thin ECharts wrapper: SVG renderer (crisp text, direct SVG export),
 * resize observer, reduced-motion support, shared typography defaults.
 */
export default function EChart({
  option,
  height = 360,
  ariaLabel,
  onEvents,
  onInit,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chart = init(ref.current, undefined, { renderer: "svg" });
    chartRef.current = chart;
    /*
     * Resolved here rather than handed to ECharts as a `var(--font-sans)`
     * string, which failed twice over.
     *
     * The string never named --font-sans-arabic at all, so every Arabic
     * label rendered in Inter - a face with no Arabic glyphs - and fell
     * through to whatever the system had.
     *
     * Worse, and in both languages: zrender measures text by assigning to
     * canvas `ctx.font`, and a font shorthand containing `var(...)` is
     * invalid, so the assignment silently failed and the canvas stayed at
     * its default `10px sans-serif`. Every label width, every
     * overlap-hide decision and every containLabel grid size was computed
     * against a font no chart was drawn in.
     *
     * The container inherits the page's own stack, and [dir="rtl"] body
     * swaps in the Arabic face, so reading the computed value gives each
     * locale the right one without this component knowing which it is.
     */
    const fontFamily = getComputedStyle(ref.current).fontFamily;
    const base: EChartsOption = {
      animation: !reduced,
      animationDuration: 200,
      textStyle: {
        fontFamily,
        color: UI.text,
      },
      tooltip: { confine: true },
    };
    chart.setOption({ ...base, ...option });
    if (onEvents) {
      for (const [event, handler] of Object.entries(onEvents)) {
        chart.on(event, handler);
      }
    }
    onInit?.(chart);
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // Option identity is managed by the parent; re-init on change is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
