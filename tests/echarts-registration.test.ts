import { describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { init } from "echarts/core";
import type { EChartsOption } from "echarts";

/**
 * EChart.tsx registers ECharts piece by piece rather than importing the
 * whole library, which keeps ~150KB gzip off every route - and means a
 * chart using an unregistered series or component renders empty with only
 * a console warning to show for it. That failure reaches a reader before
 * it reaches a test, so both halves of the contract are checked here:
 * every series type the charts ask for must be registered, and the option
 * shapes they actually build must render without ECharts complaining.
 *
 * Importing the wrapper runs its registration, so these tests check the
 * real list rather than a copy that could drift from it.
 */
import "@/components/charts/EChart";

const SRC = join(import.meta.dirname, "..", "src");
const REGISTRATION_FILE = join(SRC, "components", "charts", "EChart.tsx");

const SERIES_COMPONENT: Record<string, string> = {
  bar: "BarChart",
  line: "LineChart",
  scatter: "ScatterChart",
  heatmap: "HeatmapChart",
  treemap: "TreemapChart",
  custom: "CustomChart",
  pie: "PieChart",
  radar: "RadarChart",
  sankey: "SankeyChart",
  graph: "GraphChart",
  gauge: "GaugeChart",
  funnel: "FunnelChart",
  effectScatter: "EffectScatterChart",
  map: "MapChart",
  boxplot: "BoxplotChart",
  candlestick: "CandlestickChart",
  themeRiver: "ThemeRiverChart",
  sunburst: "SunburstChart",
  pictorialBar: "PictorialBarChart",
  lines: "LinesChart",
};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Files that render through the shared EChart wrapper. */
function chartFiles(): string[] {
  return walk(SRC).filter((f) => {
    if (f.endsWith("EChart.tsx")) return false;
    const src = readFileSync(f, "utf8");
    return /from "(\.\/|@\/components\/charts\/|\.\.\/charts\/)EChart"/.test(src);
  });
}

describe("every series type the charts use is registered", () => {
  it("finds no series type missing from EChart.tsx", () => {
    const registration = readFileSync(REGISTRATION_FILE, "utf8");
    const missing: string[] = [];
    for (const file of chartFiles()) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/type:\s*"([a-zA-Z]+)"/g)) {
        const component = SERIES_COMPONENT[m[1]];
        if (component && !registration.includes(component)) {
          missing.push(`${file.split("src")[1]}: series "${m[1]}" needs ${component}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

/**
 * The option shapes the site actually builds. ECharts itself is the judge:
 * an unregistered component logs "used but not imported" and silently
 * drops that piece of the chart.
 */
const SHAPES: Record<string, EChartsOption> = {
  "axis-triggered bar with legend": {
    grid: { left: 100, right: 30, top: 10, bottom: 25 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0 },
    xAxis: { type: "value" },
    yAxis: { type: "category", data: ["a", "b"] },
    series: [{ type: "bar", data: [1, 2] }],
  },
  "two-panel titled heatmap with one shared visual map": {
    title: [
      { text: "2024", left: 130, top: 6 },
      { text: "2026", left: 130, top: 246 },
    ],
    grid: [
      { left: 130, top: 30, height: 175 },
      { left: 130, top: 270, height: 175 },
    ],
    xAxis: [
      { gridIndex: 0, type: "category", data: ["a"] },
      { gridIndex: 1, type: "category", data: ["a"] },
    ],
    yAxis: [
      { gridIndex: 0, type: "category", data: ["x"] },
      { gridIndex: 1, type: "category", data: ["x"] },
    ],
    visualMap: {
      seriesIndex: [0, 1],
      min: 0,
      max: 5,
      inRange: { color: ["#F2F5F8", "#173B63"] },
    },
    series: [
      { type: "heatmap", xAxisIndex: 0, yAxisIndex: 0, data: [[0, 0, 3]] },
      { type: "heatmap", xAxisIndex: 1, yAxisIndex: 1, data: [[0, 0, 5]] },
    ],
  },
  "diverging heatmap with continuous visual map": {
    grid: { left: 120, right: 20, top: 10, bottom: 90 },
    tooltip: {},
    xAxis: { type: "category", data: ["s"] },
    yAxis: { type: "category", data: ["l"] },
    visualMap: {
      type: "continuous",
      min: -5,
      max: 5,
      inRange: { color: ["#BD5A46", "#FFFFFF", "#1B8295"] },
    },
    series: [{ type: "heatmap", data: [[0, 0, -3]] }],
  },
  "time scatter with positioned labels": {
    grid: { left: 110, right: 30, top: 20, bottom: 70 },
    tooltip: { trigger: "item" },
    xAxis: { type: "time", min: "2024-09-01", max: "2026-08-15" },
    yAxis: { type: "value", min: -0.5, max: 4.5 },
    series: [
      {
        type: "scatter",
        data: [{ value: ["2025-01-01", 1], label: { position: "bottom" } }],
        label: { show: true },
      },
    ],
  },
  "dumbbell: custom plus line plus scatter": {
    grid: { left: 220, right: 40, top: 10, bottom: 30 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: { type: "value" },
    yAxis: { type: "category", data: ["r"] },
    series: [
      {
        type: "custom",
        renderItem: () => ({ type: "circle", shape: { cx: 5, cy: 5, r: 3 } }),
        data: [[1, 0]],
      },
      { type: "line", data: [1] },
      { type: "scatter", data: [[1, 0]] },
    ],
  },
  treemap: {
    tooltip: {},
    series: [{ type: "treemap", data: [{ name: "n", value: 4 }] }],
  },
};

describe("every option shape the charts build renders without complaint", () => {
  for (const [name, option] of Object.entries(SHAPES)) {
    it(name, () => {
      const errors: string[] = [];
      const collect = (...args: unknown[]) => void errors.push(args.join(" "));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(collect);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(collect);
      try {
        const chart = init(null, null, {
          renderer: "svg",
          ssr: true,
          width: 600,
          height: 300,
        });
        chart.setOption(option);
        const svg = chart.renderToSVGString();
        chart.dispose();
        expect(svg).toContain("<svg");
      } finally {
        errorSpy.mockRestore();
        warnSpy.mockRestore();
      }
      expect(
        errors.filter((e) => /not imported|not exists|unknown/i.test(e)),
        `ECharts complained: ${errors.join(" | ")}`,
      ).toEqual([]);
    });
  }
});
