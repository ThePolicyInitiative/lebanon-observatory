"use client";

import type { Locale } from "@/lib/vocab";
import { useRovingRadio } from "@/lib/useRovingRadio";

/**
 * Three-position year control (2024 | Side-by-side | 2026) with an
 * optional "Show change" switch. Year colours are used only here and on
 * comparison markers - never for actor identity.
 */
export type YearMode = "2024" | "side" | "2026" | "change";

const T = {
  en: {
    side: "Side-by-side",
    group: "Year view",
    showChange: "Show change (2026 − 2024)",
  },
  ar: {
    side: "جنباً إلى جنب",
    group: "عرض السنة",
    showChange: "أظهر الفارق (2026 − 2024)",
  },
} as const;

export default function YearControl({
  mode,
  onChange,
  withChange = true,
  idPrefix = "yearmode",
  locale = "en",
}: {
  mode: YearMode;
  onChange: (m: YearMode) => void;
  withChange?: boolean;
  idPrefix?: string;
  locale?: Locale;
}) {
  const t = T[locale];
  const positions: { id: YearMode; label: string; color?: string }[] = [
    { id: "2024", label: "2024", color: "var(--color-y2024)" },
    { id: "side", label: t.side },
    { id: "2026", label: "2026", color: "var(--color-y2026)" },
  ];
  const roving = useRovingRadio({
    count: positions.length,
    activeIndex: positions.findIndex((p) => p.id === mode),
    onActivate: (i) => onChange(positions[i].id),
  });
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label={t.group}
        className="inline-flex overflow-hidden rounded-md border border-border bg-white"
      >
        {positions.map((p, i) => {
          const active = mode === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              id={`${idPrefix}-${p.id}`}
              {...roving.itemProps(i)}
              onClick={() => onChange(p.id)}
              className={`min-h-11 px-4 text-sm transition-colors duration-150 ${
                active
                  ? "font-semibold text-white"
                  : "text-text-secondary hover:text-navy"
              }`}
              style={
                active
                  ? { background: p.color ?? "var(--color-navy)" }
                  : undefined
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {withChange ? (
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={mode === "change"}
            onChange={(e) => onChange(e.target.checked ? "change" : "side")}
            className="h-4 w-4 accent-rust"
          />
          {t.showChange}
        </label>
      ) : null}
    </div>
  );
}
