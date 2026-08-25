/**
 * The JavaScript mirror of the palette defined in src/app/globals.css.
 *
 * It exists because charts need literals: ECharts writes colours into
 * canvas and SVG paint attributes, where a `var(--token)` does not reliably
 * resolve, so the chart layer cannot read the custom properties the rest of
 * the site is styled from. That makes two copies of the palette
 * unavoidable - but it does NOT make them free to disagree, which is what
 * happened. Every value in this file had drifted from its token: the teal
 * every NGO/international chip is drawn from measured 4.49:1 on white where
 * the token measured 5.49:1, the 2026 green 3.99:1 where the token measured
 * 4.84:1, and the background named a warm off-white on a site whose ground
 * is a cool grey.
 *
 * tests/design-tokens.test.ts now parses globals.css and fails if these two
 * copies ever say different things again. Change a colour there, not here,
 * and let the test tell you what to bring across.
 *
 * Actor-layer colours and year colours serve different purposes and must
 * not be mixed: layer colours identify actors in compositions; year colours
 * mark time controls, outlines and comparison markers only.
 */
export const LAYER_COLORS = {
  official: "#173B63",
  ngo_international: "#177384",
  municipal: "#D69600",
  community: "#A34F7C",
} as const;

export const YEAR_COLORS = {
  y2024: "#58779B",
  y2026: "#28805F",
  /** Text on the pale 2026-green tint; the fill green is short of 4.5:1 there. */
  y2026Text: "#257759",
  negative: "#B04A37", // negative change / bottleneck
  warning: "#D69600", // financing or implementation warning
} as const;

export const UI = {
  background: "#EAEFF4",
  navy: "#173B63",
  blue: "#2E74B5",
  teal: "#177384",
  amber: "#D69600",
  magenta: "#A34F7C",
  rust: "#B04A37",
  text: "#1F2D3D",
  textSecondary: "#5D6B7D",
  border: "#DBE3EC",
} as const;

export const LAYER_META: {
  id: keyof typeof LAYER_COLORS;
  label: string;
  short: string;
  color: string;
}[] = [
  { id: "official", label: "Official institutions", short: "Official", color: LAYER_COLORS.official },
  { id: "ngo_international", label: "NGOs & international agencies", short: "NGO / International", color: LAYER_COLORS.ngo_international },
  { id: "municipal", label: "Municipalities & local authorities", short: "Municipal", color: LAYER_COLORS.municipal },
  { id: "community", label: "Community initiatives", short: "Community", color: LAYER_COLORS.community },
];

export const STATUS_LABELS: Record<string, string> = {
  formal_mandate: "Formal mandate",
  announced: "Announced",
  planned: "Planned",
  financing_committed: "Finance committed",
  financing_disbursed: "Finance disbursed",
  procurement: "Procurement initiated",
  underway: "Traced activity",
  completed: "Completed output",
  not_verified: "Not confirmed",
};

export const COMPARABILITY_LABELS: Record<string, string> = {
  direct: "Directly comparable",
  qualified: "Comparable with qualification",
  not_comparable: "Not directly comparable",
  context_only: "Context only",
};
