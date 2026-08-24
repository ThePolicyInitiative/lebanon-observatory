"use client";

import { useRef, type KeyboardEvent, type RefCallback } from "react";

/**
 * Composite-widget keyboard pattern for one-of-many button groups: the
 * radio groups and same-page tab bars across the site. One Tab stop for
 * the whole group (the active item; the first item when none is active),
 * arrow keys moving the selection with wrap-around, Home and End jumping
 * to the ends. Selection follows focus, the standard for radio groups
 * and for tabs whose panel lives on the same page.
 *
 * Direction is read from the element itself at keydown time, so under
 * RTL the Left arrow still moves to the visually-left item - which is
 * the NEXT item in DOM order there. Up and Down are direction-free.
 */
export function useRovingRadio({
  count,
  activeIndex,
  onActivate,
}: {
  /** How many items the group currently renders. */
  count: number;
  /** Index of the selected item; -1 when nothing is selected. */
  activeIndex: number;
  /** Called with the index the keyboard moved the selection to. */
  onActivate: (index: number) => void;
}): {
  itemProps: (index: number) => {
    tabIndex: number;
    ref: RefCallback<HTMLElement>;
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  };
} {
  // Slots past `count` can go stale when the group shrinks, but the key
  // handler only ever reaches indices below `count`, so they are never
  // read; unmounting items null their own slots via the ref callback.
  const refs = useRef<(HTMLElement | null)[]>([]);

  function handleKey(e: KeyboardEvent<HTMLElement>, index: number) {
    if (count === 0 || e.ctrlKey || e.altKey || e.metaKey) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let next: number;
    switch (e.key) {
      case "ArrowRight":
        next = rtl ? index - 1 : index + 1;
        break;
      case "ArrowLeft":
        next = rtl ? index + 1 : index - 1;
        break;
      case "ArrowDown":
        next = index + 1;
        break;
      case "ArrowUp":
        next = index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const wrapped = ((next % count) + count) % count;
    if (wrapped !== index) onActivate(wrapped);
    refs.current[wrapped]?.focus();
  }

  // The one Tab stop: the active item, or the first item when the group
  // has no selection (a year control whose "show change" switch is on).
  const stop = activeIndex >= 0 ? activeIndex : 0;

  return {
    itemProps: (index: number) => ({
      tabIndex: index === stop ? 0 : -1,
      ref: (el: HTMLElement | null) => {
        refs.current[index] = el;
      },
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => handleKey(e, index),
    }),
  };
}
