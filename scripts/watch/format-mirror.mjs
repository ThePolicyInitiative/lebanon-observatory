/**
 * Amount and date formatting for the writer, mirroring `src/lib/format.ts`.
 *
 * A mirror rather than an import: these scripts run on plain Node with no
 * TypeScript loader, and the site module is imported by client components
 * so it cannot be rewritten as `.mjs` without churn.
 *
 * Mirrors in this repository have drifted before - `build-search-index.mjs`
 * hand-copies vocabulary from `src/lib/vocab.ts`, and a rename left the two
 * disagreeing with nothing to catch it. So this one is pinned:
 * `tests/format-mirror.test.ts` runs both implementations over the same
 * inputs and fails on the first disagreement. Change one, change the other.
 */

export function fmtUsd(value, locale = "en") {
  const ar = locale === "ar";
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    const n = b % 1 === 0 ? b.toFixed(0) : b.toFixed(2).replace(/0$/, "");
    return ar ? `${n} مليار دولار` : `US$${n} billion`;
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    const n = m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/0$/, "");
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

export function fmtDate(iso, locale = "en") {
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

/**
 * The long English form the KPI labels are written in - "29 June 2026",
 * not the "29 Jun 2026" that `fmtDate` prints for dense chart furniture.
 */
export function fmtDateLong(iso) {
  if (!iso) return "n.d.";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
