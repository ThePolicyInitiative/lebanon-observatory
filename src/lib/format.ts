type Loc = "en" | "ar";

/**
 * Amounts and dates read in whichever language the page is written in.
 * Both helpers default to English, so the callers that never pass a locale
 * keep printing exactly what they printed before. Digits stay Western in
 * both languages: the figures are the one thing that must look identical
 * on the two sides of the site.
 */
export function fmtUsd(value: number, locale: Loc = "en"): string {
  const ar = locale === "ar";
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    const n = b % 1 === 0 ? b.toFixed(0) : b.toFixed(2).replace(/0$/, "");
    return ar ? `${n} مليار دولار` : `US$${n} billion`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    const n = m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/0$/, "");
    /*
     * Arabic counts three to ten with the plural, so ten million is
     * "عشرة ملايين" and not "10 مليون" - and the LEAP project-management
     * component is exactly 10,000,000, so this was wrong on a live page.
     *
     * Whole millions only. A fractional count takes the singular by
     * convention - "4.13 مليون دولار" is right and is what the finance
     * funnel already writes by hand - and 4.13 would otherwise fall into
     * the three-to-ten branch and come out as "4.13 ملايين".
     */
    if (ar) {
      const whole = value % 1_000_000 === 0 ? Number(n) : null;
      return whole !== null && whole >= 3 && whole <= 10
        ? `${n} ملايين دولار`
        : `${n} مليون دولار`;
    }
    return `US$${n} million`;
  }
  const n = value.toLocaleString("en-US");
  return ar ? `${n} دولار` : `US$${n}`;
}

/** Levantine month names, the form the Arabic copy already uses. */
const AR_MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
];

export function fmtUsdCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 2)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

export function fmtDate(iso: string | null, locale: Loc = "en"): string {
  if (!iso) return locale === "ar" ? "بلا تاريخ" : "n.d.";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  if (locale === "ar")
    return `${d.getUTCDate()} ${AR_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function fmtDateTime(iso: string, locale: Loc = "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (locale === "ar")
    return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}، ${hm}`;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A change with its sign, as plain text.
 *
 * The sign needs isolating wherever this is printed on the Arabic side.
 * A bare + or - carries no direction of its own, so it takes the
 * paragraph's and lands to the right of the digits - "35+" where the
 * value is +35, which a reader can take for a different number rather
 * than a mirrored one.
 *
 * The isolation is left to the caller rather than baked in here, because
 * this is used in three kinds of place and each wants a different device:
 * `<bdi>` or dir="ltr" in HTML, an isolate character in a plain-text
 * accessible name, and nothing at all inside a chart that already
 * positions its own text. An invisible control character returned from
 * here would end up in all three and be visible in none.
 */
export function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}
