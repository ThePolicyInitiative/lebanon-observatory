import destruction from "@/data/destruction.json";
import type { Locale } from "@/lib/vocab";

const T = {
  en: {
    title: "Three debris estimates, three separate rulers",
    sub: "Deliberately not one chart: the estimates differ in scope, method and timing, so they are shown side by side and never summed or compared.",
    caveat:
      "The 2026 zone figures are snapshots of assessed zones only and are not cumulative with the 2024 estimate. Quantities of this order sit beyond any municipal capability - the tracking compares them to years of national construction activity.",
    tiles: [
      "2024 war, six governorates",
      "2026, South of the Litani only",
      "2026, Beirut & Mount Lebanon only",
    ],
    methods: [
      "Remote sensing, stated density assumptions",
      "GeoAI imagery review",
      "Imagery cross-checked with the army and UN security · field-checked",
    ],
  },
  ar: {
    title: "ثلاثة تقديرات للركام، ثلاثة مساطر منفصلة",
    sub: "ليست رسماً واحداً عن قصد: التقديرات تختلف في النطاق والمنهجية والتوقيت، فتُعرض جنباً إلى جنب ولا تُجمع ولا تُقارن.",
    caveat:
      "أرقام منطقتَي 2026 لقطات للمناطق المقيَّمة وحدها ولا تُجمع مع تقدير 2024. كميات بهذا الحجم تتجاوز أي قدرة بلدية - والتتبّع يقارنها بسنوات من النشاط الإنشائي الوطني.",
    tiles: [
      "حرب 2024، ست محافظات",
      "2026، جنوب الليطاني وحده",
      "2026، بيروت وجبل لبنان وحدهما",
    ],
    methods: [
      "استشعار عن بعد بافتراضات كثافة معلنة",
      "مراجعة صور بمنهجية GeoAI",
      "صور مُقارَنة بمعطيات الجيش والأمن الأممي · معاينة ميدانية",
    ],
  },
} as const;

/**
 * Debris volumes as three deliberate stat tiles - NOT a shared-axis chart,
 * because the three estimates use different methods, scopes and timings
 * and must never be compared or summed.
 */
export default function DebrisTiles({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  const south = destruction.zones2026.find((z) => z.id === "south-litani")!;

  /**
   * Figure, scope and a short method tag only. The full method sentences and
   * the surrounding prose are already printed on the cards above this figure,
   * and repeating them here said the same thing twice on one page.
   */
  const tiles = [
    {
      figure: "≈12M m³",
      title: tr.tiles[0],
      method: tr.methods[0],
    },
    {
      figure: "3.1M m³",
      title: tr.tiles[1],
      method: `${tr.methods[1]} · ${locale === "ar" ? south.checkedByAr : south.checkedBy.toLowerCase()}`,
    },
    {
      figure: "648,942 m³",
      title: tr.tiles[2],
      method: tr.methods[2],
    },
  ];

  return (
    <figure className="card card-interactive p-4 sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-navy">
          {tr.title}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          {tr.sub}
        </p>
      </figcaption>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.title}
            className="panel-sunken p-4"
          >
            <p className="text-2xl font-bold tabular-nums tracking-tight text-navy">
              {t.figure}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-text">
              {t.title}
            </p>
            <p className="mt-2 border-t border-dashed border-border pt-1.5 text-[11px] leading-relaxed text-text-secondary">
              {t.method}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 note-caution text-xs leading-relaxed text-text-secondary">
        {tr.caveat}
      </p>
    </figure>
  );
}
