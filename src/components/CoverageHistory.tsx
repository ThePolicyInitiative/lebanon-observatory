import archive from "@/data/coverage-archive.json";
import { fmtDate } from "@/lib/format";
import type { Locale } from "@/lib/vocab";
import { AR_COUNT, arabicCount } from "@/lib/vocab";

/**
 * The coverage history: long-form reporting and analysis of the two wars
 * and what followed, compiled by hand and kept beside the live feed.
 *
 * A server component with no client JavaScript. The set is static
 * history, so filtering runs on URL parameters rendered as links: it
 * works before hydration, survives a reload, is shareable, and costs the
 * page nothing. Shipping the whole compilation to the browser to filter
 * it there would be the wrong trade for a list that never changes.
 *
 * This is outside the tracking. Nothing here enters a count, a matrix or
 * a map, and the framing says so wherever a reader meets it.
 */

type Item = {
  id: string;
  year: number;
  kind: string;
  language: string;
  publisher: string;
  title: string;
  date: string | null;
  focus: string;
  focusAr?: string;
  url: string;
};

const KINDS = ["news", "research", "official", "assessment", "rights"] as const;

const T = {
  en: {
    heading: "Coverage history",
    lede: "Long-form reporting and analysis of the 2024 and 2026 wars and what followed, read and picked by hand. It sits beside the live feed above, which reaches back about a month. Every item is outside the tracking: none of it enters a count, a matrix or a map.",
    filterYear: "Year",
    filterKind: "Kind",
    all: "All",
    clear: "Clear filters",
    showing: (n: number, total: number) =>
      n === total ? `${total} ${total === 1 ? "piece" : "pieces"}` : `${n} of ${total} pieces`,
    none: "Nothing matches these filters.",
    undated: "Date not given",
    yearHeading: (year: number, n: number) => `${year} - ${n} ${n === 1 ? "piece" : "pieces"}`,
    kinds: {
      news: "News",
      research: "Research and analysis",
      official: "Official",
      assessment: "Assessment",
      rights: "Rights",
    } as Record<string, string>,
    opens: (publisher: string) => `(opens the piece on ${publisher})`,
  },
  ar: {
    heading: "أرشيف التغطية",
    lede: "تغطية وتحليلات مطوّلة لحربَي 2024 و2026 وما تلاهما، قُرئت واختيرت يدوياً. تقف إلى جانب الشريط المباشر أعلاه الذي يعود نحو شهر إلى الوراء. وكل ما هنا خارج التتبّع: لا يدخل في عدّ ولا مصفوفة ولا خريطة.",
    filterYear: "السنة",
    filterKind: "النوع",
    all: "الكل",
    clear: "إزالة الترشيح",
    showing: (n: number, total: number) =>
      n === total ? `${total} مادة` : `${n} من أصل ${total} مادة`,
    none: "لا شيء يطابق هذا الترشيح.",
    undated: "بلا تاريخ",
    yearHeading: (year: number, n: number) => `${year} - ${arabicCount(n, AR_COUNT.piece)}`,
    kinds: {
      news: "أخبار",
      research: "بحوث وتحليل",
      official: "رسمي",
      assessment: "تقييم",
      rights: "حقوق",
    } as Record<string, string>,
    opens: (publisher: string) => `(يفتح المادة لدى ${publisher})`,
  },
} as const;

const KIND_CHIP: Record<string, string> = {
  news: "bg-[#EEF2F7] text-navy",
  research: "bg-[#E8F1F3] text-teal",
  official: "bg-[#F4EAF0] text-magenta",
  assessment: "bg-[#FAF3E3] text-[#8a6200]",
  rights: "bg-[#F7E9E5] text-rust",
};

const ITEMS = archive.items as Item[];
const YEARS = [...new Set(ITEMS.map((i) => i.year))].sort((a, b) => b - a);

/** Filter links carry the other filter forward, so the two compose. */
function href(base: string, year: string | null, kind: string | null): string {
  const q = new URLSearchParams();
  if (year) q.set("hy", year);
  if (kind) q.set("hk", kind);
  const s = q.toString();
  return s ? `${base}?${s}#coverage-history` : `${base}#coverage-history`;
}

export default function CoverageHistory({
  locale = "en",
  year = null,
  kind = null,
}: {
  locale?: Locale;
  /** From the page's search parameters; anything unrecognised is ignored. */
  year?: string | null;
  kind?: string | null;
}) {
  const t = T[locale];
  const base = locale === "ar" ? "/ar/reported" : "/reported";

  const activeYear = YEARS.some((y) => String(y) === year) ? year : null;
  const activeKind = (KINDS as readonly string[]).includes(kind ?? "") ? kind : null;

  const shown = ITEMS.filter(
    (i) =>
      (activeYear === null || String(i.year) === activeYear) &&
      (activeKind === null || i.kind === activeKind),
  );

  const chip = (label: string, on: boolean, to: string) => (
    <a
      key={`${label}-${to}`}
      href={to}
      aria-current={on ? "true" : undefined}
      className={`inline-flex min-h-8 items-center rounded-md border px-2.5 text-micro transition-colors ${
        on
          ? "border-navy bg-navy font-semibold text-white"
          : "border-border bg-white text-text-secondary hover:text-navy"
      }`}
    >
      {label}
    </a>
  );

  // The section keeps #coverage-history because every filter link scrolls to
  // it; the heading needs an id of its own, or aria-labelledby resolves to
  // the section itself and the block has no accessible name.
  return (
    <section aria-labelledby="coverage-history-heading" id="coverage-history" className="mt-10 scroll-mt-[calc(var(--header-h)+1rem)]">
      <h2 id="coverage-history-heading" className="text-h2 font-semibold text-navy">
        {t.heading}
      </h2>
      <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
        {t.lede}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-micro font-semibold text-text-secondary">
            {t.filterYear}
          </span>
          {chip(t.all, activeYear === null, href(base, null, activeKind))}
          {YEARS.map((y) =>
            chip(String(y), activeYear === String(y), href(base, String(y), activeKind)),
          )}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-micro font-semibold text-text-secondary">
            {t.filterKind}
          </span>
          {chip(t.all, activeKind === null, href(base, activeYear, null))}
          {KINDS.map((k) =>
            chip(
              `${t.kinds[k]} (${ITEMS.filter((i) => i.kind === k).length})`,
              activeKind === k,
              href(base, activeYear, k),
            ),
          )}
        </span>
        {activeYear || activeKind ? (
          <a
            href={href(base, null, null)}
            className="text-meta font-medium text-blue underline-offset-2 hover:underline"
          >
            {t.clear}
          </a>
        ) : null}
      </div>

      <p className="mt-3 text-meta text-text-secondary">
        {t.showing(shown.length, ITEMS.length)}
      </p>

      {shown.length === 0 ? (
        <p className="mt-4 rounded-md bg-[#F6F8FA] px-3 py-4 text-body text-text-secondary">
          {t.none}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {YEARS.filter((y) => shown.some((i) => i.year === y)).map((y, yi) => {
            const inYear = shown.filter((i) => i.year === y);
            return (
              <details
                key={y}
                // The newest year opens, and any narrowed view opens whole:
                // a reader who filtered has already said what they want.
                open={yi === 0 || activeYear !== null || activeKind !== null}
                className="card"
              >
                <summary className="cursor-pointer list-none text-body font-semibold text-navy [&::-webkit-details-marker]:hidden">
                  {t.yearHeading(y, inYear.length)}
                </summary>
                <ul className="mt-3 space-y-3">
                  {inYear.map((item) => (
                    <li
                      key={item.id}
                      dir={item.language === "ar" ? "rtl" : "ltr"}
                      className="border-s-2 border-border ps-3"
                    >
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-text-secondary">
                        <span className="tabular-nums">
                          {item.date ? fmtDate(item.date, locale) : t.undated}
                        </span>
                        <span aria-hidden>·</span>
                        <span className="font-semibold">{item.publisher}</span>
                        <span
                          className={`rounded-sm px-1.5 py-0.5 font-semibold ${KIND_CHIP[item.kind] ?? ""}`}
                        >
                          {t.kinds[item.kind] ?? item.kind}
                        </span>
                      </p>
                      <h4 className="mt-1 text-meta font-semibold leading-snug text-navy">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.title} <span aria-hidden dir="ltr">↗</span>
                          <span className="sr-only">{t.opens(item.publisher)}</span>
                        </a>
                      </h4>
                      <p className="mt-1 text-meta leading-relaxed text-text">
                        {locale === "ar" ? (item.focusAr ?? item.focus) : item.focus}
                      </p>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
