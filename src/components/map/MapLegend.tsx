import { layers, type Locale } from "@/lib/vocab";
import type { Year } from "@/lib/types";

/**
 * The map's key. Both renderers use it, so the vector map and the
 * pan-and-zoom map cannot end up explaining themselves differently.
 *
 * It states the two things a reader has to know before trusting a pin:
 * what its colour means, and that its position is the town, not an
 * address. Everything else on the map is derived from those.
 */

const T = {
  en: {
    heading: "Key",
    pins: "One pin per traced entry, coloured by actor layer",
    episode: "Hollow ring: a traced episode - something that happened here",
    context: "Conflict context",
    ground: "The land itself is unshaded: colour on this map means an actor layer and nothing else.",
    fan: "Entries in the same town are fanned around its centre so each can be read and opened. A pin marks the town the reporting names, never a street address.",
    occupied:
      "Rust: Blue Line border-strip towns with traced occupation (indicative); rust dash: the districts containing them.",
  },
  ar: {
    heading: "مفتاح القراءة",
    pins: "دبّوس واحد لكل مدخل مرصود، بلون طبقة الجهة",
    episode: "حلقة مفرغة: واقعة مرصودة - شيء جرى هنا",
    context: "سياق الحرب",
    ground: "الأرض نفسها بلا تظليل: اللون على هذه الخريطة يعني طبقة جهة ولا شيء آخر.",
    fan: "المدخلات في البلدة نفسها تُنشر حول مركزها ليمكن قراءة كل واحد منها وفتحه. والدبّوس يشير إلى البلدة التي يسمّيها الإبلاغ، لا إلى عنوان في شارع.",
    occupied:
      "الخمري: بلدات الشريط الحدودي على الخط الأزرق التي رُصد فيها احتلال (إشارة تقريبية)؛ والتقطيع الخمري: الأقضية التي تضمّها.",
  },
} as const;

export default function MapLegend({
  locale = "en",
  year,
  className = "",
}: {
  locale?: Locale;
  year: Year;
  className?: string;
}) {
  const t = T[locale];
  return (
    <div
      className={`rounded-md border border-[color:var(--color-border)] bg-white/95 p-3 text-[11px] leading-snug ${className}`}
    >
      <p className="font-semibold text-[color:var(--color-navy)]">{t.heading}</p>

      {/* Actor layers - the colour every pin carries. */}
      <p className="mt-1.5 text-[color:var(--color-text-secondary)]">{t.pins}</p>
      <ul className="mt-1 grid gap-x-3 gap-y-1 sm:grid-cols-2">
        {layers(locale).map((l) => (
          <li key={l.id} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white"
              style={{ background: l.color }}
            />
            <span className="text-[color:var(--color-text)]">{l.short}</span>
          </li>
        ))}
      </ul>

      {/* Pin shapes. */}
      <ul className="mt-2 space-y-1 border-t border-dashed border-[color:var(--color-border)] pt-2">
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-white"
            style={{ borderColor: "#8FA1B5" }}
          />
          <span className="text-[color:var(--color-text-secondary)]">{t.episode}</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-full border"
            style={{ background: "#667588", borderColor: "#384049" }}
          />
          <span className="text-[color:var(--color-text-secondary)]">{t.context}</span>
        </li>
      </ul>

      {/* What the ground is not, and what a pin's position does not mean. */}
      <p className="mt-2 border-t border-dashed border-[color:var(--color-border)] pt-2 text-[color:var(--color-text-secondary)]">
        {t.ground}
      </p>
      <p className="mt-1.5 text-[color:var(--color-text-secondary)]">{t.fan}</p>
      {year === 2026 ? (
        <p className="mt-1.5 text-[color:var(--color-text-secondary)]">{t.occupied}</p>
      ) : null}
    </div>
  );
}
