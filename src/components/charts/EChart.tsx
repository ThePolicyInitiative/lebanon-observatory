"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsOption, ECharts } from "echarts";
import { UI } from "@/lib/colors";

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
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    chartRef.current = chart;
    const base: EChartsOption = {
      animation: !reduced,
      animationDuration: 200,
      textStyle: {
        fontFamily:
          "var(--font-sans), Inter, 'Segoe UI', system-ui, sans-serif",
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
