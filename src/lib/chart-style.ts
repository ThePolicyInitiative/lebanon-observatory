import type { Locale } from "./vocab";

/**
 * Type sizes for chart furniture, in one place and in both languages.
 *
 * Twenty-five figures each declared their own, and they had not agreed for a
 * long time: axis ticks ran at 10, 11, 12 and 13px across 49 hand-typed
 * declarations, series labels at 9, 10 and 11px. Since /damage, /finance and
 * /compare stack these figures in one column, a reader scrolled past the
 * same kind of label at four sizes without anything having changed about
 * what it meant.
 *
 * Worse, the axis TITLE was 11px everywhere while ticks reached 13px, so in
 * nine files the label naming an axis was smaller than the numbers it
 * headed - the hierarchy inverted inside the figure, the same defect the
 * page headings had. The title is a step above the tick here, by
 * construction, and cannot drift back.
 *
 * These are JavaScript numbers rather than CSS tokens because ECharts writes
 * them into paint attributes and cannot read a custom property - the same
 * reason src/lib/colors.ts exists. They mirror the --text-micro step and its
 * RTL bump, and for the same reason: Plex Arabic at 11px is optically
 * smaller than Inter at 11px, so one size applied to both trees would
 * improve the English figures and degrade the Arabic ones.
 */
export type ChartText = {
  /** Axis ticks: the numbers and category names along an axis. */
  tick: number;
  /** The label naming an axis. Always a step above the ticks it heads. */
  axisTitle: number;
  /** Legend entries. */
  legend: number;
  /** Values printed on or beside a mark. */
  seriesLabel: number;
};

const EN: ChartText = { tick: 11, axisTitle: 12, legend: 11, seriesLabel: 10 };
const AR: ChartText = { tick: 12, axisTitle: 13, legend: 12, seriesLabel: 11 };

export function chartText(locale: Locale = "en"): ChartText {
  return locale === "ar" ? AR : EN;
}
