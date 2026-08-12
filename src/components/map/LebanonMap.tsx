"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MlMap, MapLayerMouseEvent } from "maplibre-gl";
import { LAYER_META, STATUS_LABELS } from "@/lib/colors";
import { locations, gazetteer, STAGES, CAUTION_MAP } from "@/lib/data-client";
import { slimRecords } from "@/lib/map-records";
import type { SlimRecord } from "@/lib/map-records";
import { useUrlState } from "@/lib/useUrlState";
import type { ActorLayer, Year } from "@/lib/types";
import {
  computeBorderStripTowns,
  featureCentroidLonLat,
  LITANI_SEGMENTS,
  type GeoFeature,
} from "@/lib/geo";
import {
  buildLocationIndex,
  matchLocations,
  type LocationIndex,
} from "@/lib/geo-match";
import {
  LOCALITY_EVENTS,
  eventsByLocality,
  eventsByTown,
  eventsFor,
  EVENT_KIND_META,
} from "@/lib/events";
import { fmtDate } from "@/lib/format";
import SvgLebanonMap, { type MapView } from "./SvgLebanonMap";

type MentionRow = Record<ActorLayer, number>;

/** True when the browser can create a GL context MapLibre can use. */
function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function mentionsFor(year: Year, regionId: string): MentionRow {
  const y = locations.mentions[String(year) as "2024" | "2026"];
  return y[regionId as keyof typeof y] as MentionRow;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function LebanonMap() {
  const { get, set, reset } = useUrlState({
    year: "2026",
    layer: "all",
    stage: "all",
    status: "all",
    comparability: "all",
    view: "entries",
  });
  const year = (get("year") === "2024" ? 2024 : 2026) as Year;
  const viewParam = get("view");
  const mapView: MapView =
    viewParam === "change" || viewParam === "damage" || viewParam === "survey"
      ? viewParam
      : "entries";
  const layerFilter = get("layer");
  const stageFilter = get("stage");
  const statusFilter = get("status");
  const comparabilityFilter = get("comparability");

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  /** Town centroids + place-name index, set once the GL map loads its data. */
  const glTownsRef = useRef<
    { name: string; district: string; lon: number; lat: number }[] | null
  >(null);
  const glIndexRef = useRef<LocationIndex | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapReadyRef = useRef(false);
  /**
   * "svg" (default) renders the build-time vector map - part of the
   * server HTML, visible everywhere. "gl" opts into MapLibre for
   * pan/zoom when the browser supports WebGL.
   */
  const [renderMode, setRenderMode] = useState<"gl" | "svg">("svg");

  /** Region totals under the current year + layer selection. */
  const regionValues = useMemo(() => {
    const values: Record<string, number> = {};
    for (const region of locations.regions) {
      const m = mentionsFor(year, region.id);
      if (!m) continue;
      values[region.id] =
        layerFilter === "all"
          ? m.official + m.municipal + m.ngo_international + m.community
          : (m[layerFilter as ActorLayer] ?? 0);
    }
    return values;
  }, [year, layerFilter]);

  /** Locality entries under the full filter set (for points + popups). */
  const localityRecords = useMemo(() => {
    const out = new Map<string, SlimRecord[]>();
    for (const loc of gazetteer.localities) {
      const needle = loc.name.toLowerCase().split("(")[0].trim();
      const recs = slimRecords.filter((r) => {
        if (r.year !== year) return false;
        if (layerFilter !== "all" && r.actorLayer !== layerFilter) return false;
        if (stageFilter !== "all" && String(r.stageNo) !== stageFilter) return false;
        if (statusFilter !== "all" && r.implementationStatus !== statusFilter) return false;
        if (comparabilityFilter !== "all" && r.comparability !== comparabilityFilter) return false;
        return (
          r.locationNames.some((l) => l.toLowerCase().includes(needle)) ||
          r.hay.includes(needle)
        );
      });
      if (recs.length > 0) out.set(loc.name, recs);
    }
    return out;
  }, [year, layerFilter, stageFilter, statusFilter, comparabilityFilter]);

  /** Entries under the non-year filters, both years (for the change view). */
  const recordsAllYears = useMemo(
    () =>
      slimRecords.filter((r) => {
        if (layerFilter !== "all" && r.actorLayer !== layerFilter) return false;
        if (stageFilter !== "all" && String(r.stageNo) !== stageFilter) return false;
        if (statusFilter !== "all" && r.implementationStatus !== statusFilter) return false;
        if (comparabilityFilter !== "all" && r.comparability !== comparabilityFilter) return false;
        return true;
      }),
    [layerFilter, stageFilter, statusFilter, comparabilityFilter],
  );

  /** Every entry under the current filter set (for district-level shading). */
  const filteredRecords = useMemo(
    () => recordsAllYears.filter((r) => r.year === year),
    [recordsAllYears, year],
  );

  const maxRegion = Math.max(
    1,
    ...locations.regions.filter((r) => r.mappable).map((r) => regionValues[r.id] ?? 0),
  );

  const rampColor =
    layerFilter === "all"
      ? "#173B63"
      : (LAYER_META.find((l) => l.id === layerFilter)?.color ?? "#173B63");

  // Initialise the GL map while in "gl" mode; tear it down on fallback.
  useEffect(() => {
    if (renderMode !== "gl") return;
    let disposed = false;
    async function init() {
      if (!containerRef.current || mapRef.current) return;
      try {
        // MapLibre is ~800 kB and the vector map is the default, so the
        // library only loads when a reader opts into pan-and-zoom.
        const maplibregl = await import("maplibre-gl");
        if (disposed || !containerRef.current) return;
        const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
        const map = new maplibregl.Map({
          container: containerRef.current,
          style:
            styleUrl && styleUrl.length > 0
              ? styleUrl
              : {
                  version: 8,
                  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
                  sources: {},
                  layers: [
                    {
                      id: "background",
                      type: "background",
                      paint: { "background-color": "#E9EDF2" },
                    },
                  ],
                },
          center: [35.65, 33.85],
          zoom: 7.3,
          minZoom: 6,
          maxZoom: 12,
          attributionControl: false,
        });
        mapRef.current = map;
        map.addControl(
          new maplibregl.AttributionControl({
            customAttribution:
              "Boundaries: geoBoundaries (public domain) · OCHA COD (CC BY-IGO) · River © OpenStreetMap contributors" +
              (styleUrl ? " · basemap © its providers" : ""),
            compact: true,
          }),
        );
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibregl.FullscreenControl(), "top-right");
        map.keyboard.enable();

        map.on("error", () => {
          /* style/tile errors are non-fatal for the overlay layers */
        });

        map.on("load", async () => {
          if (disposed) return;
          const res = await fetch("/geo/lebanon-adm1.geojson");
          const geojson = await res.json();
          // Attach the observatory zone id to each governorate feature.
          for (const f of geojson.features) {
            const name = f.properties.shapeName as string;
            const region = locations.regions.find((r) =>
              r.governorates.includes(name),
            );
            f.properties.zoneId = region?.id ?? "";
            f.properties.zoneLabel = region?.label ?? name;
          }
          map.addSource("governorates", { type: "geojson", data: geojson });
          map.addLayer({
            id: "gov-fill",
            type: "fill",
            source: "governorates",
            paint: {
              "fill-color": "#CBD5E0",
              "fill-opacity": 0.85,
            },
          });
          // District (qada) boundaries as a detail overlay beneath the
          // governorate outlines.
          const adm2Res = await fetch("/geo/lebanon-adm2.geojson");
          const districts = await adm2Res.json();
          map.addSource("districts", { type: "geojson", data: districts });
          // Town (cadastre) boundaries from the OCHA COD boundary data.
          const adm3Res = await fetch("/geo/lebanon-adm3.geojson");
          const towns = await adm3Res.json();
          map.addSource("towns", { type: "geojson", data: towns });
          const townList = (towns.features as GeoFeature[]).map((f) => ({
            name: String(f.properties.adm3_name ?? ""),
            district: String(f.properties.adm2_name ?? ""),
            ...featureCentroidLonLat(f),
          }));
          glTownsRef.current = townList;
          glIndexRef.current = buildLocationIndex(townList);
          map.addLayer({
            id: "town-fill",
            type: "fill",
            source: "towns",
            paint: { "fill-color": "#000000", "fill-opacity": 0.01 },
          });
          map.addLayer({
            id: "town-line",
            type: "line",
            source: "towns",
            paint: { "line-color": "#FFFFFF", "line-width": 0.35, "line-opacity": 0.7 },
          });
          map.addLayer({
            id: "district-line",
            type: "line",
            source: "districts",
            paint: { "line-color": "#FFFFFF", "line-width": 0.9, "line-opacity": 0.9 },
          });
          // The Litani river (© OpenStreetMap contributors).
          map.addSource("litani", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "MultiLineString", coordinates: LITANI_SEGMENTS },
            },
          });
          map.addLayer({
            id: "litani-line",
            type: "line",
            source: "litani",
            paint: { "line-color": "#4E88B0", "line-width": 1.6, "line-opacity": 0.9 },
          });
          // Town names at close zoom, from the COD layer itself.
          map.addLayer({
            id: "town-labels",
            type: "symbol",
            source: "towns",
            minzoom: 10.2,
            filter: ["!=", "adm3_name", "Conflict"],
            layout: {
              "text-field": ["get", "adm3_name"],
              "text-font": ["Noto Sans Regular"],
              "text-size": 10,
              "text-padding": 4,
            },
            paint: {
              "text-color": "#3D4C5C",
              "text-halo-color": "#FFFFFF",
              "text-halo-width": 1.4,
            },
          });
          // Occupation (2026), indicative: the demarcated zone has no
          // published geometry, so fill only the Blue Line border-strip
          // towns (derived from the boundary topology) and dash the
          // districts containing them.
          const stripTowns = [...computeBorderStripTowns(towns.features)];
          map.addLayer({
            id: "occupied-fill",
            type: "fill",
            source: "towns",
            filter: ["in", "adm3_name", ...stripTowns],
            paint: { "fill-color": "#BD5A46", "fill-opacity": 0.32 },
            layout: { visibility: "none" },
          });
          map.addLayer({
            id: "occupied-line",
            type: "line",
            source: "districts",
            filter: ["in", "shapeName", "Sour", "Bent Jbail", "Marjaayoun", "Hasbaya"],
            paint: {
              "line-color": "#BD5A46",
              "line-width": 1.4,
              "line-dasharray": [2, 1.5],
            },
            layout: { visibility: "none" },
          });
          map.addLayer({
            id: "gov-line",
            type: "line",
            source: "governorates",
            paint: { "line-color": "#FFFFFF", "line-width": 1.8 },
          });
          map.addSource("localities", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          map.addLayer({
            id: "locality-circles",
            type: "circle",
            source: "localities",
            paint: {
              "circle-color": ["get", "color"],
              "circle-opacity": 0.88,
              "circle-radius": ["get", "radius"],
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 1.5,
            },
          });

          map.on("click", "gov-fill", (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (!f) return;
            const zoneId = f.properties?.zoneId as string;
            const zoneLabel = f.properties?.zoneLabel as string;
            // Town under the cursor, if the town layer has loaded.
            const townFeat = map.getLayer("town-fill")
              ? map.queryRenderedFeatures(e.point, { layers: ["town-fill"] })[0]
              : undefined;
            const townName = townFeat?.properties?.adm3_name as string | undefined;
            const townDistrict = townFeat?.properties?.adm2_name as string | undefined;
            const townLine =
              townName && townName !== "Conflict"
                ? `<strong>${esc(townName)}</strong> · ${esc(townDistrict ?? "")} district<br/>`
                : "";
            const m = zoneId ? mentionsFor(Number(get("year") || 2026) as Year, zoneId) : null;
            const html = m
              ? `<div style="font-size:12px">${townLine}<strong>${esc(zoneLabel)}</strong><br/>Traced mentions, ${get("year") || 2026}:<br/>` +
                LAYER_META.map(
                  (l) => `<span style="color:${l.color}">■</span> ${esc(l.label)}: <strong>${m[l.id]}</strong>`,
                ).join("<br/>") +
                `<br/><em style="color:#667588">Mentions in the tracking - not damage severity or coverage.</em></div>`
              : `<div style="font-size:12px">${townLine}<strong>${esc(zoneLabel)}</strong></div>`;
            new maplibregl.Popup({ closeButton: true })
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map);
          });
          map.on("mouseenter", "gov-fill", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "gov-fill", () => {
            map.getCanvas().style.cursor = "";
          });

          map.on("click", "locality-circles", (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (!f) return;
            const html = f.properties?.popupHtml as string;
            new maplibregl.Popup({ closeButton: true, maxWidth: "340px" })
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map);
          });
          map.on("mouseenter", "locality-circles", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "locality-circles", () => {
            map.getCanvas().style.cursor = "";
          });

          mapReadyRef.current = true;
          setMapReady(true);
        });
      } catch {
        setRenderMode("svg");
      }
    }
    void init();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderMode]);

  // Watchdog: if the GL map has not become ready while the page is
  // actually visible (WebGL blocked, GPU sandboxing, stalled context),
  // fall back to the SVG map so a map is always shown.
  useEffect(() => {
    if (renderMode !== "gl" || mapReady) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      timer = setTimeout(() => {
        if (cancelled || mapReadyRef.current) return;
        if (document.visibilityState === "visible") {
          setRenderMode("svg");
        } else {
          arm(); // hidden tabs pause rendering; keep waiting
        }
      }, 7000);
    };
    arm();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [renderMode, mapReady]);

  // Update choropleth + points when filters change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // One base colour per selection; the value ramp is carried by opacity,
    // with exact values printed in the popups and table view.
    const opacityExpr: unknown[] = ["match", ["get", "zoneId"]];
    for (const region of locations.regions.filter((r) => r.mappable)) {
      const v = regionValues[region.id] ?? 0;
      const t = v / maxRegion;
      opacityExpr.push(region.id, v === 0 ? 0.08 : 0.2 + t * 0.7);
    }
    opacityExpr.push(0.15);

    if (map.getLayer("gov-fill")) {
      map.setPaintProperty("gov-fill", "fill-color", rampColor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setPaintProperty("gov-fill", "fill-opacity", opacityExpr as any);
    }
    for (const layerId of ["occupied-fill", "occupied-line"]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", year === 2026 ? "visible" : "none");
      }
    }

    const detailHtml = (
      name: string,
      district: string,
      recs: SlimRecord[],
      locEvents: ReturnType<typeof eventsFor>,
      positionNote: string,
    ): string => {
      const actors = [...new Set(recs.map((r) => r.actorName.split(":")[0]))];
      const stages = [...new Set(recs.map((r) => r.stage))];
      const statuses = [...new Set(recs.map((r) => STATUS_LABELS[r.implementationStatus]))];
      const eventsHtml = locEvents.length
        ? `<br/><span style="color:#667588">What happened here:</span>` +
          locEvents
            .slice(0, 2)
            .map(
              (ev) =>
                `<br/>• ${ev.date ? `<strong>${esc(fmtDate(ev.date))}:</strong> ` : ""}${esc(ev.text)}`,
            )
            .join("")
        : "";
      const recsHtml = recs.length
        ? `<br/><span style="color:#667588">Traced actors (${actors.length}):</span> ${esc(actors.slice(0, 6).join("; "))}${actors.length > 6 ? "…" : ""}` +
          `<br/><span style="color:#667588">Stages:</span> ${esc(stages.slice(0, 4).join("; "))}${stages.length > 4 ? "…" : ""}` +
          `<br/><span style="color:#667588">Activity status:</span> ${esc(statuses.join("; "))}`
        : "";
      return (
        `<div style="font-size:12px;line-height:1.5"><strong>${esc(name)}</strong>${district ? ` · ${esc(district)} district` : ""} · ${year}` +
        recsHtml +
        eventsHtml +
        `<br/><em style="color:#667588">${positionNote}</em></div>`
      );
    };

    // Unified point layer: every town with entries naming it or traced
    // episodes, at the town's actual centroid, coloured by leading layer.
    const geoTowns = glTownsRef.current;
    const idx = glIndexRef.current;
    const features: unknown[] = [];
    const covered = new Set<string>();
    if (geoTowns && idx) {
      const byName = new Map(geoTowns.map((t) => [t.name, t] as const));
      const townRecs = new Map<string, SlimRecord[]>();
      for (const r of filteredRecords) {
        const m = matchLocations(idx, r.locationNames ?? []);
        for (const tn of m.towns) {
          if (!townRecs.has(tn)) townRecs.set(tn, []);
          townRecs.get(tn)!.push(r);
        }
      }
      const names = new Set<string>([...townRecs.keys()]);
      for (const t of geoTowns) if (eventsByTown.has(t.name)) names.add(t.name);
      for (const name of names) {
        const t = byName.get(name);
        if (!t || name === "Conflict") continue;
        const recs = townRecs.get(name) ?? [];
        const eps = eventsFor(eventsByTown.get(name), year);
        if (recs.length === 0 && eps.length === 0) continue;
        const counts: Record<string, number> = {};
        for (const r of recs) counts[r.actorLayer] = (counts[r.actorLayer] ?? 0) + 1;
        for (const ev of eps)
          if (ev.kind !== "context") counts[ev.kind] = (counts[ev.kind] ?? 0) + 1;
        let color = "#667588";
        let best = 0;
        for (const l of LAYER_META) {
          const c = counts[l.id] ?? 0;
          if (c > best) {
            best = c;
            color = l.color;
          }
        }
        covered.add(name);
        features.push({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [t.lon, t.lat] },
          properties: {
            name,
            radius: Math.min(9, 3 + Math.sqrt(recs.length + eps.length) * 1.5),
            color,
            popupHtml: detailHtml(
              name,
              t.district,
              recs,
              eps,
              "Marker at the town's centroid - the place the sources show.",
            ),
          },
        });
      }
    }
    // Gazetteer pins only for localities no town point covers.
    for (const loc of gazetteer.localities) {
      const recs = localityRecords.get(loc.name);
      if (!recs) continue;
      if (idx) {
        const m = matchLocations(idx, [loc.name]);
        if ([...m.towns].some((tn) => covered.has(tn))) continue;
      }
      features.push({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [loc.lon, loc.lat] },
        properties: {
          name: loc.name,
          radius: Math.min(8, 3.5 + Math.sqrt(recs.length) * 0.9),
          color: "#173B63",
          popupHtml: detailHtml(
            loc.name,
            "",
            recs,
            eventsFor(eventsByLocality.get(loc.name), year),
            "Note: mentions in the actor-stage tracking; point position approximate.",
          ),
        },
      });
    }

    const src = map.getSource("localities");
    if (src && "setData" in src) {
      (src as unknown as { setData: (d: unknown) => void }).setData({
        type: "FeatureCollection",
        features,
      });
    }
  }, [mapReady, regionValues, localityRecords, filteredRecords, rampColor, maxRegion, year]);

  const selectCls =
    "min-h-11 rounded-md border border-[color:var(--color-border)] bg-white px-2.5 text-sm text-[color:var(--color-text)]";

  const nonMappable = locations.regions.filter((r) => !r.mappable);

  return (
    <div>
      {/* Controls */}
      <div className="sticky top-[52px] z-40 -mx-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="map-year" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">
              Year
            </label>
            <div className="mt-1 inline-flex overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white" role="radiogroup" aria-label="Map year">
              {(["2024", "2026"] as const).map((y) => (
                <button
                  key={y}
                  type="button"
                  role="radio"
                  aria-checked={String(year) === y}
                  onClick={() => set("year", y)}
                  className={`min-h-11 px-4 text-sm ${
                    String(year) === y ? "font-semibold text-white" : "text-[color:var(--color-text-secondary)]"
                  }`}
                  style={
                    String(year) === y
                      ? { background: y === "2024" ? "var(--color-y2024)" : "var(--color-y2026)" }
                      : undefined
                  }
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="map-layer" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">
              Actor layer
            </label>
            <select id="map-layer" className={`mt-1 ${selectCls}`} value={layerFilter} onChange={(e) => set("layer", e.target.value)}>
              <option value="all">All layers</option>
              {LAYER_META.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="map-stage" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">
              Value-chain stage (points)
            </label>
            <select id="map-stage" className={`mt-1 ${selectCls}`} value={stageFilter} onChange={(e) => set("stage", e.target.value)}>
              <option value="all">All stages</option>
              {STAGES.map((s, i) => (
                <option key={s} value={String(i + 1)}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="map-status" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">
              Implementation status (points)
            </label>
            <select id="map-status" className={`mt-1 ${selectCls}`} value={statusFilter} onChange={(e) => set("status", e.target.value)}>
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="map-comp" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">
              Comparability (points)
            </label>
            <select id="map-comp" className={`mt-1 ${selectCls}`} value={comparabilityFilter} onChange={(e) => set("comparability", e.target.value)}>
              <option value="all">All</option>
              <option value="direct">Directly comparable</option>
              <option value="qualified">Comparable with qualification</option>
              <option value="not_comparable">Not directly comparable</option>
              <option value="context_only">Context only</option>
            </select>
          </div>
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-sm text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-navy)] hover:text-[color:var(--color-navy)]"
          >
            Reset all filters
          </button>
          <button
            type="button"
            onClick={() => {
              if (renderMode === "gl") {
                setRenderMode("svg");
              } else if (webglAvailable()) {
                setRenderMode("gl");
              }
            }}
            aria-pressed={renderMode === "gl"}
            className="min-h-11 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-sm text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-navy)] hover:text-[color:var(--color-navy)]"
          >
            {renderMode === "gl" ? "Back to vector map" : "Pan & zoom (GL) map"}
          </button>
        </div>
      </div>

      <p className="mt-4 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        {CAUTION_MAP}
      </p>

      {(
        <div className={`mt-4 grid gap-4 ${renderMode === "gl" ? "lg:grid-cols-[2fr_1fr]" : ""}`}>
          {renderMode === "svg" ? (
            <SvgLebanonMap
              year={year}
              regionValues={regionValues}
              maxRegion={maxRegion}
              rampColor={rampColor}
              localityRecords={localityRecords}
              records={filteredRecords}
              recordsAllYears={recordsAllYears}
              view={mapView}
              onViewChange={(v) => set("view", v)}
            />
          ) : (
            <div className="relative overflow-hidden rounded-md border border-[color:var(--color-border)]">
              <div
                ref={containerRef}
                className="h-[440px] sm:h-[540px]"
                aria-label={`Map of Lebanon showing traced role concentration by governorate zone for ${year}. Use the table view for a keyboard-accessible alternative; the map itself supports keyboard panning and zooming when focused.`}
              />
              {/* Legend */}
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-[color:var(--color-border)] bg-white/95 p-2.5 text-[11px] leading-tight">
                <p className="font-semibold text-[color:var(--color-navy)]">
                  Traced role concentration, {year}
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  {[0.15, 0.35, 0.6, 0.9].map((o) => (
                    <span
                      key={o}
                      aria-hidden
                      className="h-3 w-6"
                      style={{ background: rampColor, opacity: o }}
                    />
                  ))}
                </div>
                <p className="mt-0.5 text-[color:var(--color-text-secondary)]">
                  fewer → more mentions · markers at traced towns, colour
                  = leading actor layer
                  {year === 2026
                    ? " · rust: Blue Line border-strip towns with traced occupation (indicative) · rust dash: districts containing them"
                    : ""}
                </p>
              </div>
            </div>
          )}

          {/* Non-mappable groupings */}
          <div className="space-y-3">
            {nonMappable.map((r) => {
              const m = mentionsFor(year, r.id);
              const total = m ? m.official + m.municipal + m.ngo_international + m.community : 0;
              return (
                <section key={r.id} className="card p-4">
                  <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                    {r.label}
                  </h3>
                  <p className="text-[11px] text-[color:var(--color-text-secondary)]">
                    Not mappable to a single governorate - shown separately
                    rather than invented onto the map.
                  </p>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-[color:var(--color-navy)]">
                    {total}{" "}
                    <span className="text-xs font-normal text-[color:var(--color-text-secondary)]">
                      mentions in {year}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {LAYER_META.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                          {l.short}
                        </span>
                        <span className="tabular-nums">{m ? m[l.id] : 0}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* What happened where: traced episodes for the selected year */}
      {(
        <section
          aria-label={`Traced episodes in ${year}`}
          className="mt-6 card p-4 sm:p-5"
        >
          <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
            What happened where - traced episodes, {year}
          </h3>
          <p className="mt-1 max-w-3xl text-xs text-[color:var(--color-text-secondary)]">
            Locality-level episodes from the verified entry: announced,
            reported or assessed - stated as such, never more. Select the same
            places on the map via their pins or the town search.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {LOCALITY_EVENTS.filter((l) => l.events.some((e) => e.year === year)).map((l) => (
              <article
                key={l.name}
                className="rounded-md border border-[color:var(--color-border)] p-3.5"
              >
                <h4 className="text-sm font-semibold text-[color:var(--color-navy)]">
                  {l.name}
                </h4>
                <ul className="mt-2 space-y-2">
                  {eventsFor(l, year).map((e, i) => {
                    const meta = EVENT_KIND_META[e.kind];
                    return (
                      <li key={i} className="text-[12.5px] leading-relaxed">
                        <span
                          className="mr-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {meta.label}
                        </span>
                        {e.date ? (
                          <span className="mr-1 font-semibold text-[color:var(--color-navy)]">
                            {fmtDate(e.date)}:
                          </span>
                        ) : null}
                        {e.text}
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
