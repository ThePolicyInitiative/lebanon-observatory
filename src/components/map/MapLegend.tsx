import { layers, type Locale } from "@/lib/vocab";

/**
 * The map's key. Both renderers use it, so the vector map and the
 * pan-and-zoom map cannot end up explaining themselves differently.
 *
 * It says one thing: what a pin's colour means. The episode and
 * conflict-context rows, the note that the ground is unshaded, the note
 * about the fan and the border-strip note have all been taken out, so
 * the key is the colour scale and nothing else.
 */

const T = {
  en: {
    heading: "Key",
    pins: "One pin per traced entry, coloured by actor layer",
  },
  ar: {
    heading: "مفتاح القراءة",
    pins: "دبّوس واحد لكل مدخل مرصود، بلون طبقة الجهة",
  },
} as const;

export default function MapLegend({
  locale = "en",
  className = "",
}: {
  locale?: Locale;
  className?: string;
}) {
  const t = T[locale];
  return (
    <div
      className={`rounded-md border border-border bg-white/95 p-3 text-[11px] leading-snug ${className}`}
    >
      <p className="font-semibold text-navy">{t.heading}</p>
      <p className="mt-1.5 text-text-secondary">{t.pins}</p>
      <ul className="mt-1 grid gap-x-3 gap-y-1 sm:grid-cols-2">
        {layers(locale).map((l) => (
          <li key={l.id} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white"
              style={{ background: l.color }}
            />
            <span className="text-text">{l.short}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
