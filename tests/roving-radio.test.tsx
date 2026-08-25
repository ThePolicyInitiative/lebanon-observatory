// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRovingRadio } from "@/lib/useRovingRadio";

/**
 * The composite-widget keyboard pattern, tested once for the six widgets
 * that share it: the year controls, the actor tab bar, the register
 * filters, the treemap, the map's year switch and the news explorer.
 *
 * All of it is arithmetic and focus, so jsdom is enough - this file asks
 * for that environment in its own docblock and leaves the rest of the
 * suite in node. What is worth guarding is not "an arrow key does
 * something" but the parts that are easy to get subtly wrong and
 * impossible to notice: wrap-around at both ends, the single Tab stop,
 * the right-to-left flip, and the cases where nothing should happen.
 */

function Group({
  count,
  activeIndex,
  onActivate,
  direction = "ltr",
}: {
  count: number;
  activeIndex: number;
  onActivate: (i: number) => void;
  direction?: "ltr" | "rtl";
}) {
  const roving = useRovingRadio({ count, activeIndex, onActivate });
  return (
    <div role="radiogroup" aria-label="test group">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={i === activeIndex}
          // The hook reads direction off the item it is handling, not off
          // the container, so the harness has to put it there too.
          style={{ direction }}
          {...roving.itemProps(i)}
        >
          item {i}
        </button>
      ))}
    </div>
  );
}

/** Selection follows focus, which is what the six widgets all do. */
function Harness({
  count = 5,
  initial = 0,
  direction = "ltr",
  onActivate,
}: {
  count?: number;
  initial?: number;
  direction?: "ltr" | "rtl";
  onActivate?: (i: number) => void;
}) {
  const [active, setActive] = useState(initial);
  return (
    <Group
      count={count}
      activeIndex={active}
      direction={direction}
      onActivate={(i) => {
        onActivate?.(i);
        setActive(i);
      }}
    />
  );
}

function items(): HTMLButtonElement[] {
  return screen.getAllByRole("radio") as HTMLButtonElement[];
}

function press(index: number, key: string, init: KeyboardEventInit = {}) {
  const el = items()[index];
  el.focus();
  return fireEvent.keyDown(el, { key, ...init });
}

afterEach(cleanup);

describe("the roving tab stop", () => {
  it("gives the whole group one Tab stop, on the selected item", () => {
    render(<Harness count={5} initial={2} />);
    const tabbable = items().filter((el) => el.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(items()[2]);
    expect(items().filter((el) => el.tabIndex === -1)).toHaveLength(4);
  });

  it("falls back to the first item when nothing is selected", () => {
    // A year control with its "show change" switch on selects no year.
    const onActivate = vi.fn();
    render(<Group count={4} activeIndex={-1} onActivate={onActivate} />);
    const tabbable = items().filter((el) => el.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(items()[0]);
  });
});

describe("arrow keys under left-to-right", () => {
  it("moves focus and selection together", () => {
    const onActivate = vi.fn();
    render(<Harness count={5} initial={0} onActivate={onActivate} />);
    press(0, "ArrowRight");
    expect(onActivate).toHaveBeenCalledWith(1);
    expect(document.activeElement).toBe(items()[1]);
    expect(items()[1].getAttribute("aria-checked")).toBe("true");
    expect(items()[1].tabIndex).toBe(0);
  });

  it("wraps past the last item back to the first", () => {
    const onActivate = vi.fn();
    render(<Harness count={5} initial={4} onActivate={onActivate} />);
    press(4, "ArrowRight");
    expect(onActivate).toHaveBeenCalledWith(0);
    expect(document.activeElement).toBe(items()[0]);
  });

  it("wraps back from the first item to the last", () => {
    const onActivate = vi.fn();
    render(<Harness count={5} initial={0} onActivate={onActivate} />);
    press(0, "ArrowLeft");
    expect(onActivate).toHaveBeenCalledWith(4);
    expect(document.activeElement).toBe(items()[4]);
  });

  it("jumps to the ends with Home and End", () => {
    const onActivate = vi.fn();
    render(<Harness count={5} initial={2} onActivate={onActivate} />);
    press(2, "End");
    expect(onActivate).toHaveBeenLastCalledWith(4);
    expect(document.activeElement).toBe(items()[4]);
    press(4, "Home");
    expect(onActivate).toHaveBeenLastCalledWith(0);
    expect(document.activeElement).toBe(items()[0]);
  });

  it("takes over the key so the page does not scroll under it", () => {
    render(<Harness count={5} initial={1} />);
    // fireEvent returns false when the handler called preventDefault.
    expect(press(1, "ArrowRight")).toBe(false);
    expect(press(2, "Home")).toBe(false);
  });
});

describe("arrow keys under right-to-left", () => {
  /**
   * Left means visually left in both languages. Under RTL the item to the
   * visual left is the NEXT one in DOM order, so the two horizontal keys
   * swap - and only those two.
   */
  it("sends Left to the next item and Right to the previous one", () => {
    const onActivate = vi.fn();
    render(<Harness count={5} initial={2} direction="rtl" onActivate={onActivate} />);
    press(2, "ArrowLeft");
    expect(onActivate).toHaveBeenLastCalledWith(3);
    expect(document.activeElement).toBe(items()[3]);
    press(3, "ArrowRight");
    expect(onActivate).toHaveBeenLastCalledWith(2);
    expect(document.activeElement).toBe(items()[2]);
  });

  it("leaves Up and Down alone, because a column has no direction", () => {
    const onActivate = vi.fn();
    render(<Harness count={5} initial={2} direction="rtl" onActivate={onActivate} />);
    press(2, "ArrowDown");
    expect(onActivate).toHaveBeenLastCalledWith(3);
    press(3, "ArrowUp");
    expect(onActivate).toHaveBeenLastCalledWith(2);
  });

  it("wraps the same way at both ends", () => {
    const onActivate = vi.fn();
    render(<Harness count={4} initial={3} direction="rtl" onActivate={onActivate} />);
    press(3, "ArrowLeft");
    expect(onActivate).toHaveBeenLastCalledWith(0);
    expect(document.activeElement).toBe(items()[0]);
  });
});

describe("the cases where nothing should happen", () => {
  it("leaves modified arrow keys to the browser", () => {
    for (const modifier of ["ctrlKey", "altKey", "metaKey"] as const) {
      const onActivate = vi.fn();
      render(<Harness count={5} initial={1} onActivate={onActivate} />);
      // Not prevented, so a browser shortcut still reaches the browser.
      expect(press(1, "ArrowRight", { [modifier]: true })).toBe(true);
      expect(onActivate).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(items()[1]);
      cleanup();
    }
  });

  it("ignores keys it does not own", () => {
    const onActivate = vi.fn();
    render(<Harness count={5} initial={1} onActivate={onActivate} />);
    expect(press(1, "a")).toBe(true);
    expect(press(1, "PageDown")).toBe(true);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("never re-selects the only item in a group of one", () => {
    const onActivate = vi.fn();
    render(<Harness count={1} initial={0} onActivate={onActivate} />);
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End", "ArrowDown"]) {
      press(0, key);
    }
    expect(onActivate).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(items()[0]);
  });

  it("does nothing at all in an empty group", () => {
    const onActivate = vi.fn();
    const { container } = render(<Group count={0} activeIndex={-1} onActivate={onActivate} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(onActivate).not.toHaveBeenCalled();
  });
});

describe("a group that shrinks", () => {
  /**
   * The hook keeps one ref slot per index and never prunes the tail. If a
   * stale slot were ever reachable, End on a group that shrank from five
   * items to three would move focus to an element no longer in the page -
   * focus would silently go nowhere.
   */
  it("never sends focus to a slot the group no longer renders", () => {
    function Shrinking() {
      const [count, setCount] = useState(5);
      const [active, setActive] = useState(4);
      return (
        <>
          <button type="button" onClick={() => { setCount(3); setActive(0); }}>
            shrink
          </button>
          <Group count={count} activeIndex={active} onActivate={setActive} />
        </>
      );
    }
    render(<Shrinking />);
    expect(items()).toHaveLength(5);
    const dropped = [items()[3], items()[4]];

    fireEvent.click(screen.getByText("shrink"));
    expect(items()).toHaveLength(3);

    press(0, "End");
    expect(document.activeElement).toBe(items()[2]);
    expect(dropped).not.toContain(document.activeElement);

    press(2, "ArrowRight");
    expect(document.activeElement).toBe(items()[0]);
    expect(document.body.contains(document.activeElement)).toBe(true);
  });
});
