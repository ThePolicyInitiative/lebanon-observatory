/**
 * Design tokens. Actor-layer colours and year colours serve different
 * purposes and must not be mixed: layer colours identify actors in
 * compositions; year colours mark time controls, outlines and
 * comparison markers only.
 */
export const LAYER_COLORS = {
  official: "#173B63",
  ngo_international: "#1B8295",
  municipal: "#D69600",
  community: "#A34F7C",
} as const;

export const YEAR_COLORS = {
  y2024: "#58779B",
  y2026: "#2F8F6B",
  negative: "#BD5A46", // negative change / bottleneck
  warning: "#D69600", // financing or implementation warning
} as const;

export const UI = {
  background: "#FAFAF7",
  navy: "#173B63",
  blue: "#2E74B5",
  teal: "#1B8295",
  amber: "#D69600",
  magenta: "#A34F7C",
  rust: "#BD5A46",
  text: "#263645",
  textSecondary: "#667588",
  border: "#DCE3EA",
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
  not_verified: "Not verified",
};

export const COMPARABILITY_LABELS: Record<string, string> = {
  direct: "Directly comparable",
  qualified: "Comparable with qualification",
  not_comparable: "Not directly comparable",
  context_only: "Context only",
};
