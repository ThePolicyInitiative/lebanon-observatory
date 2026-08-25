"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Locale } from "@/lib/vocab";
import {
  contextOf,
  groupByKind,
  hrefOf,
  kindLabel,
  KIND_ORDER,
  labelOf,
  prepare,
  runQuery,
  type SearchIndex,
  type SearchKind,
} from "@/lib/search";

/**
 * The one way in. Every page on this site searches itself - the explorer
 * searches the traced entries, the news page searches the coverage, the
 * register searches the actors - and a reader who knows a town, an actor, a
 * stage or an indicator had nowhere to start. This searches the site's own
 * surfaces instead: pages and their sections, actors, places, stages,
 * layers, indicators and milestones.
 *
 * The index is fetched once on mount and filtered in memory, so typing
 * costs nothing over the wire. Both languages sit in the same index: an
 * Arabic query and its English equivalent land on the same target, and the
 * label printed beside it is the one for the page the reader is on.
 */

const COPY = {
  en: {
    // Narrower than the page's own heading on purpose: the two used to be
    // the same sentence, so a screen reader read it twice in a row.
    label: "Your query",
    placeholder: "A town, an actor, a stage, an indicator",
    hint: "Start typing. Arabic and English both work, and Arabic matches without diacritics.",
    scope: "What a query reaches from here:",
    loading: "Loading the search index",
    failed: "The search index did not load. Reload the page to try again.",
    count: (n: number) => (n === 1 ? "1 match" : `${n} matches`),
    none: "Nothing matches that. Try a shorter word, or the other language.",
    more: (n: number) => `Show the remaining ${n} of this kind`,
    fewer: "Show fewer",
  },
  ar: {
    label: "استعلامك",
    placeholder: "بلدة أو جهة فاعلة أو مرحلة أو مؤشّر",
    hint: "ابدأ الكتابة. العربية والإنجليزية تعملان معاً، والعربية تُطابَق من دون تشكيل.",
    scope: "ما الذي يبلغه البحث من هنا:",
    loading: "جارٍ تحميل فهرس البحث",
    failed: "تعذّر تحميل فهرس البحث. أعد تحميل الصفحة للمحاولة من جديد.",
    count: (n: number) =>
      n === 1
        ? "نتيجة واحدة"
        : n === 2
          ? "نتيجتان"
          : n <= 10
            ? `${n} نتائج`
            : `${n} نتيجة`,
    none: "لا شيء يطابق ذلك. جرّب كلمة أقصر أو اللغة الأخرى.",
    more: (n: number) => `أظهر الـ${n} الباقية من النوع نفسه`,
    fewer: "أظهر عدداً أقل",
  },
} as const;

/**
 * Per group, so one broad query cannot bury the other groups - and the
 * rest of the group is one button away, because a line that says more
 * hits exist and offers no way to reach them is worse than a long list.
 */
const PER_GROUP = 20;

const ARROWS = ["ArrowDown", "ArrowUp", "Home", "End"];

/** One array, so an untouched query keeps the same identity every render. */
const NO_KINDS: SearchKind[] = [];

export default function SiteSearch({ locale = "en" }: { locale?: Locale } = {}) {
  const t = COPY[locale];
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  /**
   * The groups the reader has opened past the cap, and the query they
   * were opened for: a new query is a new set of groups. Reading the
   * query back out here rather than clearing this in an effect keeps the
   * reset in the same render as the typing that caused it.
   */
  const [opened, setOpened] = useState<{ query: string; kinds: SearchKind[] }>({
    query: "",
    kinds: [],
  });
  const resultsRef = useRef<HTMLDivElement>(null);

  /* The index, once. */
  useEffect(() => {
    let dropped = false;
    fetch("/search-index.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((body: SearchIndex) => {
        if (!dropped) setIndex(body);
      })
      .catch(() => {
        if (!dropped) setFailed(true);
      });
    return () => {
      dropped = true;
    };
  }, []);

  /**
   * The query travels in the URL, so a search can be handed to someone
   * else, but it is written there a beat after the typing rather than on
   * every keystroke. The guard on the current value is what keeps the
   * write from starting a round trip with itself.
   */
  useEffect(() => {
    if ((params.get("q") ?? "") === query) return;
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (query) next.set("q", query);
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => clearTimeout(id);
  }, [query, params, pathname, router]);

  const openedKinds = opened.query === query ? opened.kinds : NO_KINDS;

  const prepared = useMemo(() => prepare(index?.items ?? []), [index]);
  const results = useMemo(() => runQuery(prepared, query), [prepared, query]);
  const groups = useMemo(() => groupByKind(results), [results]);

  const typed = query.trim().length > 0;
  const status = failed
    ? t.failed
    : index === null
      ? t.loading
      : !typed
        ? ""
        : results.length > 0
          ? t.count(results.length)
          : t.none;

  /**
   * Arrow keys walk the hits. Every hit keeps its own tab stop - a reader
   * on Tab alone still reaches all of them - so this is a shortcut over the
   * list, not a roving group; useRovingRadio would take the group down to
   * one tab stop, which is right for a radio group and wrong here. Enter
   * follows the link, which is the browser's own behaviour on a link.
   */
  function onResultsKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!ARROWS.includes(e.key) || e.ctrlKey || e.altKey || e.metaKey) return;
    const fromInput = (e.target as HTMLElement).tagName === "INPUT";
    if (fromInput && (e.key === "Home" || e.key === "End")) return;
    const links = Array.from(
      resultsRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-hit]") ?? [],
    );
    if (links.length === 0) return;
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    let next: number;
    if (e.key === "ArrowDown") next = at + 1;
    else if (e.key === "ArrowUp") next = at <= 0 ? links.length - 1 : at - 1;
    else if (e.key === "Home") next = 0;
    else next = links.length - 1;
    e.preventDefault();
    links[((next % links.length) + links.length) % links.length]?.focus();
  }

  return (
    <div onKeyDown={onResultsKeyDown}>
      <div role="search" className="max-w-2xl">
        <label
          htmlFor="site-q"
          className="block text-[13px] font-semibold text-[color:var(--color-navy)]"
        >
          {t.label}
        </label>
        <input
          id="site-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 min-h-11 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 text-sm text-[color:var(--color-text)]"
        />
        <p className="mt-2 text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {t.hint}
        </p>
      </div>

      {/* The count as it changes, for a reader who cannot see the list. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      <div ref={resultsRef} className="mt-6">
        {failed ? (
          <p className="note-caution text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {t.failed}
          </p>
        ) : index === null ? (
          /* The wait is announced by the live region above; an aria-label
             on a plain div would not be read anyway. */
          <div aria-busy="true" className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-md border border-[color:var(--color-border)] bg-white"
              />
            ))}
          </div>
        ) : !typed ? (
          /* Empty state: what a query can reach, and how much of each. */
          <div className="card p-3.5">
            <p className="text-[13px] font-semibold text-[color:var(--color-navy)]">
              {t.scope}
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {KIND_ORDER.filter((kind) => (index.counts[kind] ?? 0) > 0).map((kind) => (
                <li
                  key={kind}
                  className="text-[12.5px] text-[color:var(--color-text-secondary)]"
                >
                  {kindLabel(kind, locale)}{" "}
                  <span className="font-semibold tabular-nums text-[color:var(--color-navy)]">
                    {index.counts[kind]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {t.none}
          </p>
        ) : (
          <>
            <p
              aria-hidden
              className="text-[12.5px] font-semibold text-[color:var(--color-text-secondary)]"
            >
              {t.count(results.length)}
            </p>
            <div className="mt-3 space-y-6">
              {groups.map((group) => {
                const open = openedKinds.includes(group.kind);
                const shown = open ? group.items : group.items.slice(0, PER_GROUP);
                return (
                  <section key={group.kind} aria-labelledby={`hits-${group.kind}`}>
                    <h2
                      id={`hits-${group.kind}`}
                      className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-semibold text-[color:var(--color-navy)]"
                    >
                      {kindLabel(group.kind, locale)}
                      <span className="text-[12px] font-normal tabular-nums text-[color:var(--color-text-secondary)]">
                        {group.items.length}
                      </span>
                    </h2>
                    <ul id={`hits-list-${group.kind}`} className="mt-2 space-y-1.5">
                      {shown.map((item) => {
                        const context = contextOf(item, locale);
                        return (
                          <li key={`${item.k}-${item.h}-${item.t}`}>
                            <Link
                              data-hit=""
                              href={hrefOf(item, locale)}
                              className="card card-interactive block p-2.5 ps-3"
                            >
                              <span className="block text-sm font-medium text-[color:var(--color-navy)]">
                                {labelOf(item, locale)}
                              </span>
                              {context ? (
                                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
                                  {context}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    {group.items.length > PER_GROUP ? (
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`hits-list-${group.kind}`}
                        onClick={() =>
                          setOpened({
                            query,
                            kinds: open
                              ? openedKinds.filter((k) => k !== group.kind)
                              : [...openedKinds, group.kind],
                          })
                        }
                        className="mt-2 inline-flex min-h-9 items-center rounded-md border border-[color:var(--color-border)] bg-white px-2.5 text-[12px] font-medium text-[color:var(--color-navy)] transition-colors hover:border-[color:var(--color-navy)]"
                      >
                        {open ? t.fewer : t.more(group.items.length - PER_GROUP)}
                      </button>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
