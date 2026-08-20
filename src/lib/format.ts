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
    return ar ? `${n} مليون دولار` : `US$${n} million`;
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

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}
