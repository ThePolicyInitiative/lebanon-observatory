"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@/lib/vocab";

/**
 * The one progressive-disclosure control the site uses.
 *
 * Depth on every page now sits behind this: a section leads with its
 * claim and its clearest figure, and the modules that substantiate it
 * fold away until asked for. Native <details>, so it opens before
 * hydration and inside either language tree - the open/closed label swap
 * is CSS (group-open), not state.
 *
 * `label` should name what opens, not say "more" - "See more: the full
 * register" reads in a screen-reader list of buttons, "See more" alone
 * does not. The chevron is decorative; the summary text carries the
 * meaning.
 *
 * Charts render fine inside a closed <details>: EChart re-measures on a
 * ResizeObserver, so it draws itself the moment the panel opens.
 *
 * The one scripted behaviour: anchors. Several folded sections keep ids
 * that the search index and older links target, and a fragment jump to
 * an element inside a closed <details> lands on nothing. So the panel
 * opens itself when the URL hash names it or anything inside it - which
 * is also why this is a client component rather than pure markup.
 */
const T = {
  en: { more: "See more", less: "See less" },
  ar: { more: "عرض المزيد", less: "إخفاء التفاصيل" },
} as const;

export default function SeeMore({
  label,
  labelOpen,
  locale = "en",
  children,
  defaultOpen = false,
}: {
  /** What this discloses, e.g. "the full register" - printed after "See more:". */
  label: string;
  /** Optional replacement label while open; falls back to the closed label. */
  labelOpen?: string;
  locale?: Locale;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const t = T[locale];
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const openIfTargeted = () => {
      const hash = window.location.hash.slice(1);
      const panel = ref.current;
      if (!hash || !panel || panel.open) return;
      const target = document.getElementById(decodeURIComponent(hash));
      if (target && panel.contains(target)) {
        panel.open = true;
        requestAnimationFrame(() => target.scrollIntoView());
      }
    };
    openIfTargeted();
    window.addEventListener("hashchange", openIfTargeted);
    return () => window.removeEventListener("hashchange", openIfTargeted);
  }, []);

  return (
    <details ref={ref} className="group mt-4" open={defaultOpen || undefined}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-meta font-semibold text-navy hover:bg-surface-raised focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">
          &#x25B8;
        </span>
        <span className="group-open:hidden">
          {t.more}: {label}
        </span>
        <span className="hidden group-open:inline">
          {t.less}: {labelOpen ?? label}
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
