"use client";

import { useEffect, useRef, useState } from "react";

import type { Locale } from "@/lib/vocab";

/**
 * The five findings, pinned under the header while the page scrolls.
 *
 * The findings page runs to about eleven thousand pixels on a desktop and
 * twice that on a phone, and findings 3-5 sit at the bottom of it: without
 * a way to jump, a reader looking for the community share scrolls the whole
 * damage and finance depth to reach two paragraphs. The strip names each
 * finding by its subject - the wording the home teasers already use - and
 * marks the one under the reader's viewport.
 *
 * The ids are the h2 ids both language pages already share, so the strip
 * needs no ids of its own and deep links keep landing where they always
 * did.
 */
const ITEMS: Record<Locale, { id: string; label: string }[]> = {
  en: [
    { id: "finding-needs", label: "Damage and needs" },
    { id: "finding-frameworks", label: "The money's path" },
    { id: "finding-plan", label: "Plan and response" },
    { id: "finding-community", label: "The community share" },
    { id: "finding-stages", label: "The early stages" },
  ],
  ar: [
    { id: "finding-needs", label: "الأضرار والاحتياجات" },
    { id: "finding-frameworks", label: "مسار المال" },
    { id: "finding-plan", label: "الخطة والاستجابة" },
    { id: "finding-community", label: "حصة المجتمع المحلي" },
    { id: "finding-stages", label: "المراحل المبكرة" },
  ],
};

const NAV_LABEL: Record<Locale, string> = {
  en: "The five findings",
  ar: "الاستنتاجات الخمسة",
};

export default function FindingsIndex({ locale = "en" }: { locale?: Locale }) {
  const items = ITEMS[locale];
  const [active, setActive] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const readActive = () => {
      rafRef.current = 0;
      /* The finding being read is the last one whose heading has passed
         under the sticky chrome - the header plus this strip. Measured
         from the strip itself rather than assumed, so a wrapped second
         row on a narrow phone moves the threshold with it. */
      const offset = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
      let current: string | null = null;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(readActive);
    };
    readActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [items]);

  return (
    <nav
      ref={navRef}
      aria-label={NAV_LABEL[locale]}
      className="sticky top-[var(--header-h)] z-40 -mx-4 mt-8 border-b border-border bg-bg/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6"
    >
      <ol className="flex gap-1.5 overflow-x-auto py-2">
        {items.map((it, i) => {
          const isActive = active === it.id;
          return (
            <li key={it.id} className="shrink-0">
              <a
                href={`#${it.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-meta transition-colors ${
                  isActive
                    ? "border-navy bg-navy font-semibold text-white"
                    : "border-border bg-white text-text hover:border-navy"
                }`}
              >
                <span
                  className={`font-sans text-micro font-bold tabular-nums ${
                    isActive ? "text-white/70" : "text-teal"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {it.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
