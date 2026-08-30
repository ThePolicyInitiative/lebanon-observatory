import { STATE_COLORS, STATE_UNGRADED_EDGE } from "@/lib/colors";
import { statusLabel, type Locale } from "@/lib/vocab";

/**
 * A status, drawn as ink.
 *
 * Identity is hue and state is ink. The four actor layers keep the whole
 * chromatic register; a status is painted achromatically, so it cannot be
 * read as a layer. Three components used to disagree about this
 * independently - two of them painting procurement in the NGO teal and
 * formal mandate in the official navy, all three hand-typing a green that
 * belonged to no token - which is how one chip row ended up showing three
 * identity hues encoding three things that were not actor layers.
 *
 * Only the four statuses that occur across the 771 entries get a fill.
 * Anything else - including "completed output", which no entry carries -
 * falls to the unpainted rung, because inventing a colour for a category
 * with nothing in it is how the last set of tints started.
 */
const FILL: Record<string, string> = {
  formal_mandate: STATE_COLORS.formal_mandate,
  procurement: STATE_COLORS.procurement,
  underway: STATE_COLORS.underway,
};

/**
 * White on the two darker rungs, and the darkest rung as ink on the
 * lightest.
 *
 * #87909c carries white at 3.23:1, which is enough for a graphical object
 * and not for text - and a chip's label is text. The site's own text
 * colour was the obvious ink and measures 4.33:1 on it, still under 4.5.
 * The ramp's own darkest rung reaches 5.19:1, needs no new token, and
 * keeps the chip inside the graphite family rather than borrowing a
 * colour from somewhere with a different job.
 *
 * Lightening the fill instead was the other option and is worse: it
 * clears the text threshold by dropping the rung under 3:1 against the
 * sunken panel, which is the surface half these chips sit on.
 */
const INK: Record<string, string> = {
  formal_mandate: STATE_COLORS.underway,
  procurement: "#ffffff",
  underway: "#ffffff",
};

export default function StateChip({
  status,
  locale = "en",
  className = "",
}: {
  status: string;
  locale?: Locale;
  className?: string;
}) {
  const fill = FILL[status];
  const label = statusLabel(status, locale);

  // The unpainted rung: an outline, because "not confirmed" is the absence
  // of a grade rather than the bottom of the ladder - and it is the
  // largest of the four counts, so it must stay quiet and still be seen.
  if (!fill) {
    return (
      <span
        className={`chip ${className}`}
        style={{
          background: "var(--color-surface)",
          color: "var(--color-text-secondary)",
          boxShadow: `inset 0 0 0 1px ${STATE_UNGRADED_EDGE}`,
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <span className={`chip ${className}`} style={{ background: fill, color: INK[status] }}>
      {label}
    </span>
  );
}
