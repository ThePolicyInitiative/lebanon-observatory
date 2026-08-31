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
  /**
   * The old navy. Since the cedar restyle this is the official layer's
   * own token (--color-official): the chrome moved to green, the data
   * did not. A restyle may redress the chrome, never re-code the data.
   */
  official: "#173B63",
  ngo_international: "#177384",
  municipal: "#D69600",
  community: "#A34F7C",
} as const;

export const YEAR_COLORS = {
  y2024: "#58779B",
  y2026: "#175C3F",
  /**
   * The blue is 4.13:1 as text on its own #eef2f7 chip, so it takes a
   * darker sibling. The green needs none: at 7.96:1 on white and 6.91:1 on
   * its tint it carries text itself. The asymmetry is in the colours, not
   * in the rule.
   */
  y2024Text: "#516D8F",
  negative: "#B04A37", // negative change / bottleneck
  warning: "#D69600", // financing or implementation warning
} as const;

/**
 * Direction of change, named apart from the years it borrows from.
 *
 * Teal used to mean both "NGO/international actor" and "this went up", and
 * both appeared on /actors - one colour answering two questions on a single
 * page. Teal is identity only now. On this site positive always means grew
 * from 2024 to 2026, so `good` is the 2026 colour and the year controls have
 * already taught the reader that association.
 */
export const VALENCE = {
  good: YEAR_COLORS.y2026,
  bad: YEAR_COLORS.negative,
  /**
   * Caution, which used to be the municipal amber doing a second job.
   * #d69600 is the municipal layer's identity colour, and on a dense page
   * that put amber municipal counters beside amber caution rules within
   * one screen. Amber is identity only now, on the same reasoning this
   * file already applied to teal, and caution is carried by its readable
   * sibling - 5.49:1 on white, against the amber's 2.55:1.
   */
  caution: "#8a6200",
} as const;

/**
 * Status, as ink rather than hue - the JS mirror of the state ramp in
 * globals.css.
 *
 * Identity is hue and state is ink: the four layer colours keep the whole
 * chromatic register, and a status is drawn achromatically so it can
 * never be mistaken for a layer. Three components used to paint
 * procurement in the NGO teal and formal mandate in the official navy,
 * which is exactly the confusion this prevents.
 *
 * Only the statuses that occur are named. Across the 771 entries: not
 * confirmed 404, traced activity 301, formal mandate 54, procurement 12,
 * completed output 0 - so completion is reserved to a legend outline and
 * has no fill here to be drawn with by accident.
 */
export const STATE_COLORS = {
  formal_mandate: "#87909c",
  procurement: "#4e5764",
  underway: "#141e2c",
} as const;

/** The edge that makes the unpainted "not confirmed" rung countable. */
export const STATE_UNGRADED_EDGE = "#7b8696";

/**
 * The four greys every chart draws its furniture from.
 *
 * Twenty-five figures were each re-typing these, and they had drifted into
 * near-duplicates of tokens that already existed: `#DCE3EA` on seventeen
 * axis lines is one step from `--color-border` #DBE3EC and identical to the
 * eye, so the axis rule and the card border were two colours pretending to
 * be different. `#263645` on thirteen labels and `#667588` on fourteen more
 * are the pre-correction text and secondary-text values, which the palette
 * had already moved on from.
 *
 * Four decisions instead of forty-four literals - and because they are the
 * same tokens the rest of the site is styled from, a chart's furniture now
 * moves when the page's does.
 *
 * JS values, never var(): ECharts writes these into paint attributes, which
 * is the whole reason this file exists.
 */
export const UI = {
  background: "#EDF0EA",
  /** What a card is, and therefore what a figure inside one sits on. */
  surface: "#FFFFFF",
  /** The quiet inset panel, and the lightest thing a chart cell can be
   *  while still being distinguishable from the card behind it. */
  surfaceSunken: "#F4F6F0",
  /** The chrome ink - deep cedar since the restyle; the name stayed with
   *  the token. The official layer's navy lives in LAYER_COLORS only. */
  navy: "#143F35",
  blue: "#2E74B5",
  teal: "#177384",
  amber: "#D69600",
  magenta: "#A34F7C",
  rust: "#B04A37",
  text: "#1D2B24",
  textSecondary: "#57665C",
  textMuted: "#82917F",
  /**
   * Outlines a pale fill that has to stay pale and still be seen. Sized
   * against the fill it encloses, not the card behind it: 3.02:1 on the
   * palest of them.
   */
  outlineQuiet: "#7B8696",
  border: "#D9E0D4",
} as const;

export const CHART = {
  /** Axis lines and any rule drawn as chart furniture. */
  axis: UI.border,
  /** Gridlines, the same rule at lower emphasis. */
  grid: UI.border,
  /** Axis ticks, legends, and anything secondary inside a figure. */
  label: UI.textSecondary,
  /** In-figure text that carries a value or a name. */
  text: UI.text,
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
