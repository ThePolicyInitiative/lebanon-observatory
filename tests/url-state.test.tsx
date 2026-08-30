// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useUrlState } from "@/lib/useUrlState";

/**
 * The shareable-URL filter state behind five views: the explorer, the map,
 * the actor tabs, the compare panel and the news explorer. Whether a
 * filtered view has a URL worth sending anyone comes down to two rules
 * here - a value equal to its default is REMOVED from the query rather
 * than written, and a batch of changes produces exactly one navigation.
 * Both are easy to break and neither shows up in a screenshot.
 *
 * next/navigation is stubbed, so this stays a unit test of the arithmetic:
 * no router, no browser history, no route.
 */

const nav = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  pathname: "/entries",
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push, prefetch: vi.fn() }),
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.params,
}));

const DEFAULTS = { year: "all", layer: "all", stage: "all", q: "" };

/** Renders the hook as one of the views would, over a given query string. */
function mount(query = "", pathname = "/entries") {
  nav.params = new URLSearchParams(query);
  nav.pathname = pathname;
  return renderHook(() => useUrlState(DEFAULTS));
}

beforeEach(() => {
  nav.replace.mockClear();
  nav.push.mockClear();
});
afterEach(cleanup);

describe("reading filter state out of the URL", () => {
  it("prefers the parameter, then the default, then nothing", () => {
    const { result } = mount("layer=official");
    expect(result.current.get("layer")).toBe("official");
    // Absent, but the view declares a default for it.
    expect(result.current.get("year")).toBe("all");
    // Absent and undeclared: empty, never undefined, so callers can
    // compare it without guarding.
    expect(result.current.get("nosuchkey")).toBe("");
  });

  it("reads an empty declared default as empty", () => {
    const { result } = mount("");
    expect(result.current.get("q")).toBe("");
  });
});

describe("writing filter state into the URL", () => {
  it("writes a non-default value into the query, without scrolling", () => {
    const { result } = mount("");
    act(() => result.current.set("layer", "official"));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith("/entries?layer=official", { scroll: false });
  });

  it("keeps the parameters already in the URL", () => {
    const { result } = mount("layer=official");
    act(() => result.current.set("q", "beirut"));
    const [url] = nav.replace.mock.calls[0];
    expect(url).toContain("layer=official");
    expect(url).toContain("q=beirut");
  });

  /**
   * The rule that keeps a shared URL readable: a filter sitting at its
   * default carries no information, so it is deleted rather than written.
   * A view with every filter at its default has a bare path.
   */
  it("removes a value that has gone back to its default", () => {
    const { result } = mount("layer=official&year=2026");
    act(() => result.current.set("layer", "all"));
    expect(nav.replace).toHaveBeenCalledWith("/entries?year=2026", { scroll: false });
  });

  it("removes an emptied value and a nulled one", () => {
    const { result } = mount("q=beirut&layer=official");
    act(() => result.current.set("q", ""));
    expect(nav.replace).toHaveBeenLastCalledWith("/entries?layer=official", { scroll: false });

    nav.replace.mockClear();
    const second = mount("q=beirut&layer=official");
    act(() => second.result.current.set("layer", null));
    expect(nav.replace).toHaveBeenLastCalledWith("/entries?q=beirut", { scroll: false });
  });

  it("leaves a bare path when every filter is back at its default", () => {
    const { result } = mount("layer=official");
    act(() => result.current.set("layer", "all"));
    expect(nav.replace).toHaveBeenCalledWith("/entries", { scroll: false });
  });

  it("applies a batch of changes in a single navigation", () => {
    const { result } = mount("layer=official&stage=5");
    act(() =>
      result.current.setMany({ year: "2026", layer: "community", stage: "all", q: "saida" }),
    );
    expect(nav.replace).toHaveBeenCalledTimes(1);
    const [url, options] = nav.replace.mock.calls[0];
    expect(options).toEqual({ scroll: false });
    const written = new URLSearchParams(String(url).split("?")[1]);
    expect(written.get("year")).toBe("2026");
    expect(written.get("layer")).toBe("community");
    expect(written.get("q")).toBe("saida");
    // Set back to its default in the same batch, so deleted, not written.
    expect(written.has("stage")).toBe(false);
  });

  it("strips the whole query on reset, keeping the route", () => {
    const { result } = mount("layer=official&year=2026&q=beirut", "/ar/entries");
    act(() => result.current.reset());
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith("/ar/entries", { scroll: false });
  });
});
