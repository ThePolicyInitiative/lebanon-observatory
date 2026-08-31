import { layers, type Locale } from "@/lib/vocab";
import { pinOutline } from "@/lib/pins";

/**
 * The map's key. Both renderers use it, and they no longer draw the same
 * mark, so the key says which one it is explaining. The vector map - the
 * default - shades each town by how many traced entries name it, in one
 * hue at a time; the opt-in pan-and-zoom map still draws a pin per
 * entry, coloured by actor group. Words only: the counts live on the
 * map's own place labels and panels, and the group swatches carry no
 * figures because the groups read against each other here.
 */

const T = {
  en: {
    heading: "Key",
    pins: "One pin per traced entry, coloured by actor group",
    area: "The deeper a town's colour, the more traced entries name it. Towns where nothing is traced keep the plain ground.",
    areaGroups:
      "With every group showing, the shading is navy; narrowed to a single group, it takes that group's colour:",
  },
  ar: {
    heading: "مفتاح القراءة",
    pins: "دبّوس واحد لكل مدخل مرصود، بلون مجموعة الجهة",
    area: "كلما اشتدّ لون البلدة زادت المدخلات المرصودة التي تسمّيها. والبلدات التي لا شيء مرصود فيها تبقى بلون الأرضية.",
    areaGroups:
      "حين تُعرض المجموعات كلها يكون التظليل كحلياً؛ وحين يضيق الترشيح إلى مجموعة واحدة يأخذ التظليل لون تلك المجموعة:",
  },
} as const;

export default function MapLegend({
  locale = "en",
  className = "",
  variant = "area",
}: {
  locale?: Locale;
  className?: string;
  /** "area" for the shaded vector map, "pins" for the GL pin map. */
  variant?: "area" | "pins";
}) {
  const t = T[locale];
  return (
    <div
      className={`rounded-md border border-border bg-white/95 p-3 text-micro leading-snug ${className}`}
    >
      <p className="font-semibold text-navy">{t.heading}</p>
      <p className="mt-1.5 text-text-secondary">
        {variant === "pins" ? t.pins : t.area}
      </p>
      {variant === "area" ? (
        <p className="mt-1 text-text-secondary">{t.areaGroups}</p>
      ) : null}
      <ul className="mt-1 grid gap-x-3 gap-y-1 sm:grid-cols-2">
        {/*
          * The swatch is the one mark on the page that has to be seen for
          * the rest of the map to mean anything, so it answers to the same
          * 3:1 the marks do. It carried `ring-white` on a white card, which
          * is no ring at all, leaving the municipal amber to hold the edge
          * by itself at 2.55:1. The ring is the mark's own darkened outline
          * now, so the key is drawn the way the thing it explains is. A
          * round swatch reads as a pin, a rectangular one as an area, so
          * the shape follows the variant.
          */}
        {layers(locale).map((l) => (
          <li key={l.id} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={
                variant === "pins"
                  ? "h-2.5 w-2.5 shrink-0 rounded-full"
                  : "h-2.5 w-4 shrink-0 rounded-sm"
              }
              style={{ background: l.color, boxShadow: `0 0 0 1px ${pinOutline(l.color)}` }}
            />
            <span className="text-text">{l.short}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
