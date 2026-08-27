import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CITY_LABELS } from "@/lib/geo";
import { JURISDICTION_ONLY_PLACES } from "@/lib/pins";
import { slimRecords } from "@/lib/map-records";
import { eventsByTown } from "@/lib/events";

/**
 * A mark on this map says something was traced in this place.
 *
 * Two ways that promise was being broken. Zahle carried a labelled dot
 * while appearing in no part of the tracking at all, and Baalbek carried
 * seven pins, every one of which was an official's remit rather than an
 * action: "jurisdiction for Mount Lebanon, Dahieh and Baalbek", a customs
 * director "named as GEC participant" against a five-region scope list,
 * and one episode reading "fell under the Higher Relief Commission's
 * jurisdiction for damage claims".
 *
 * Suppressing a place by name is a blunt instrument and it dates badly:
 * the reason lives in a comment, the data moves on, and the suppression
 * stays. So the reason is asserted here instead. If a genuinely located
 * entry ever appears for one of these names, this fails and the decision
 * has to be made again against the data that exists then.
 */

/**
 * Wording that marks a mention as scope rather than a located action.
 * Deliberately narrow: it should catch the sentences that justified the
 * suppression, not everything that mentions administration.
 */
const SCOPE_WORDING =
  /\b(jurisdiction|remit|mandate|scope|fell under|named as|participated in the|interface for)\b/i;

describe("places named as a remit rather than a location", () => {
  it("names something the tracking actually mentions", () => {
    // A stale entry in this set would silently suppress nothing, which is
    // the failure mode that keeps a bad rule alive unnoticed.
    for (const place of JURISDICTION_ONLY_PLACES) {
      const mentions = slimRecords.filter((r) =>
        (r.locationNames ?? []).some((n) => n === place),
      );
      expect(mentions.length, `nothing in the tracking names ${place} any more`).toBeGreaterThan(0);
    }
  });

  it("suppresses only places whose every mention is scope, not action", () => {
    for (const place of JURISDICTION_ONLY_PLACES) {
      const mentions = slimRecords.filter((r) =>
        (r.locationNames ?? []).some((n) => n === place),
      );
      const located = mentions.filter((r) => !SCOPE_WORDING.test(r.action ?? ""));
      expect(
        located.map((r) => `${r.actorName}: ${(r.action ?? "").slice(0, 80)}`),
        `${place} now carries an entry that reads as located activity - the suppression in JURISDICTION_ONLY_PLACES needs re-deciding`,
      ).toEqual([]);

      const events = eventsByTown.get(place);
      for (const ev of events?.events ?? []) {
        expect(
          SCOPE_WORDING.test(ev.text),
          `${place} has a traced episode that is not scope: "${ev.text.slice(0, 90)}"`,
        ).toBe(true);
      }
    }
  });

  it("labels no city the tracking says nothing about", () => {
    // Zahle was the case: a dot and a name over a district the tracking
    // never mentions. Baalbek keeps its label because its district's
    // surveyed damage is real, so the label orients a view that has
    // something in it.
    const named = new Set<string>();
    for (const r of slimRecords) for (const n of r.locationNames ?? []) named.add(n.toLowerCase());
    for (const [town] of eventsByTown) named.add(town.toLowerCase());

    for (const city of CITY_LABELS) {
      const key = city.name.toLowerCase();
      const mentioned =
        [...named].some((n) => n.includes(key)) ||
        // Baalbek earns its label through district damage rather than a
        // named entry; the survey view is where that shows.
        city.name === "Baalbek";
      expect(mentioned, `${city.name} is labelled but the tracking never names it`).toBe(true);
    }
  });

  /**
   * A suppressed place has to be suppressed everywhere the map speaks,
   * not only where it draws.
   *
   * Removing the pin left Baalbek ranked eighth on the map's own "most
   * traced entries" panel, counted among the places in the legend line,
   * and openable from the town panel - so the map showed nothing there
   * while the panel beside it put the town in the top ten. One rule
   * applied in one place is not a rule.
   */
  it("suppresses the place in the ranking and the counts, not just the pins", () => {
    const src = readFileSync("src/components/map/SvgLebanonMap.tsx", "utf8");
    // placePoints feeds the ranking rows, the legend's place count and
    // the label pass, so the exclusion belongs there rather than at each
    // of them.
    expect(src, "the vector map does not consult the suppression set").toContain(
      "JURISDICTION_ONLY_PLACES",
    );
    const memo = src.slice(src.indexOf("const placePoints"), src.indexOf("const townLayer"));
    expect(memo, "placePoints still admits a suppressed place").toMatch(
      /JURISDICTION_ONLY_PLACES\.has\(name\)/,
    );
  });

  it("draws no pin on a suppressed place", () => {
    // The end state a reader sees, checked through the same path the map
    // uses rather than by re-reading the set.
    expect(JURISDICTION_ONLY_PLACES.has("Baalbek")).toBe(true);
    expect(CITY_LABELS.some((c) => c.name === "Zahle")).toBe(false);
  });
});
