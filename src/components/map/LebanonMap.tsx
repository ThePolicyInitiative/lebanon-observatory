"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FilterSpecification, Map as MlMap, MapLayerMouseEvent } from "maplibre-gl";
import { CHART, LAYER_META, UI } from "@/lib/colors";
import { locations } from "@/lib/data-client";
import { slimRecords } from "@/lib/map-records";
import {
  cautionMap,
  comparabilityLabel,
  layers,
  regionLabel,
  stageList,
  statusList,
  type Locale,
} from "@/lib/vocab";
import { useUrlState } from "@/lib/useUrlState";
import { useRovingRadio } from "@/lib/useRovingRadio";
import type { ActorLayer, Year } from "@/lib/types";
import {
  computeBorderStripTowns,
  featureCentroidLonLat,
  isOnLand,
  isUnnamedArea,
  LITANI_SEGMENTS,
  unnamedAreaFilter,
  type GeoFeature,
} from "@/lib/geo";
import { buildLocationIndex, type LocationIndex } from "@/lib/geo-match";
import {
  LOCALITY_EVENTS,
  eventsFor,
  eventText,
  localityName,
  EVENT_KIND_META,
} from "@/lib/events";
import { fmtDate } from "@/lib/format";
import { buildPins, clampToLand, layerColor, pinOutline } from "@/lib/pins";
import { buildLandIndex, isOnLandIndexed, type LandIndex } from "@/lib/land";
import MapLegend from "./MapLegend";
import SvgLebanonMap, { eventKindLabel, type MapView } from "./SvgLebanonMap";

/**
 * Fan spacing between neighbouring pins at one town, in degrees of
 * latitude - about 390 m. At 110 m the pins sat inside a single pixel at
 * national zoom and could not be told apart until deep in; at this
 * spacing a forty-entry town spans roughly 2.4 km, which separates from
 * about town zoom onward and still reads as one place from above.
 */
const PIN_SPACING_DEG = 0.0035;

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

/** Reader-facing strings of this component, both languages. */
const T = {
  en: {
    year: "Year",
    mapYear: "Map year",
    actorLayer: "Actor layer",
    allLayers: "All layers",
    stage: "Value-chain stage (points)",
    allStages: "All stages",
    status: "Implementation status (points)",
    allStatuses: "All statuses",
    comparability: "Comparability (points)",
    all: "All",
    reset: "Reset all filters",
    backToVector: "Back to vector map",
    glOptIn: "Pan & zoom (GL) map",
    /* No longer points at a table view. That view was removed by design -
       ChartFrame still says so where it refuses the prop - so this had been
       sending a screen-reader user to something that does not exist. The
       vector map, which this one replaces and the control above returns to,
       is the alternative that does. */
    glAria: (year: number) =>
      `Map of Lebanon showing traced role concentration by governorate zone for ${year}. It supports keyboard panning and zooming when focused. The vector map it replaces, reachable from the control above, names each region and district as text.`,
    districtOf: (district: string) => `${district} district`,
    tracedMentions: (year: string) => `Traced mentions, ${year}:`,
    popupCaution: "Mentions in the tracking - not damage severity or coverage.",
    tracedEntry: "Traced entry",
    tracedEpisode: "Traced episode",
    pinFoot:
      "One pin, one traced entry - placed in the town the reporting names, not at an address.",
    mentionsIn: (year: number) => `mentions in ${year}`,
    happenedAria: (year: number) => `Traced episodes in ${year}`,
    happenedHead: (year: number) => `What happened where - traced episodes, ${year}`,
    happenedSub:
      "Locality-level episodes from the tracked entries: announced, reported or assessed - stated as such, never more. Select the same places on the map via their town markers or the town search.",
  },
  ar: {
    year: "السنة",
    mapYear: "سنة الخريطة",
    actorLayer: "طبقة الجهات",
    allLayers: "كل الطبقات",
    stage: "مرحلة سلسلة القيمة (النقاط)",
    allStages: "كل المراحل",
    status: "حالة التنفيذ (النقاط)",
    allStatuses: "كل الحالات",
    comparability: "القابلية للمقارنة (النقاط)",
    all: "الكل",
    reset: "إعادة ضبط كل الترشيح",
    backToVector: "عودة إلى الخريطة المتجهة",
    glOptIn: "خريطة تحريك وتقريب (GL)",
    glAria: (year: number) =>
      `خريطة للبنان تُظهر تركّز الأدوار المرصودة بحسب مناطق المحافظات لسنة ${year}. تدعم التحريك والتقريب بلوحة المفاتيح عند التركيز عليها. والخريطة المتجهة التي حلّت هذه محلّها، ويمكن العودة إليها من الزر أعلاه، تسمّي كل منطقة وقضاء نصاً.`,
    districtOf: (district: string) => `قضاء ${district}`,
    tracedMentions: (year: string) => `الإشارات المرصودة، ${year}:`,
    popupCaution: "إشارات في التتبّع - لا شدّة الضرر ولا التغطية.",
    tracedEntry: "مدخل مرصود",
    tracedEpisode: "واقعة مرصودة",
    pinFoot:
      "دبّوس واحد لمدخل مرصود واحد - موضوع في البلدة التي يسمّيها الإبلاغ، لا على عنوان بعينه.",
    mentionsIn: (year: number) => `إشارة في ${year}`,
    happenedAria: (year: number) => `وقائع مرصودة في ${year}`,
    happenedHead: (year: number) => `ما الذي جرى وأين - وقائع مرصودة، ${year}`,
    happenedSub:
      "وقائع على مستوى البلدات من المدخلات المتتبَّعة: أُعلن أو أُبلغ أو قُيِّم - كما ورد لا أكثر. اختر الأماكن نفسها على الخريطة عبر علامات بلداتها أو عبر البحث عن بلدة.",
  },
} as const;

export default function LebanonMap({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
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
  /** Land test from the town polygons, in lon/lat. */
  const glLandRef = useRef<LandIndex | null>(null);
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
        // No custom credit line on the map face. The control stays so that
        // a configured basemap style can still carry its own provider
        // attribution, which its terms require.
        map.addControl(new maplibregl.AttributionControl({ compact: true }));
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
          // A cell of 0.02 degrees is roughly 2 km - a few polygons per
          // bucket, so a pin ray-casts a handful of rings, not 1,640.
          glLandRef.current = buildLandIndex(towns.features as GeoFeature[], 0.02);
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
            filter: unnamedAreaFilter("adm3_name") as FilterSpecification,
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
            paint: { "fill-color": UI.rust, "fill-opacity": 0.32 },
            layout: { visibility: "none" },
          });
          map.addLayer({
            id: "occupied-line",
            type: "line",
            source: "districts",
            filter: ["in", "shapeName", "Sour", "Bent Jbail", "Marjaayoun", "Hasbaya"],
            paint: {
              "line-color": UI.rust,
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
            id: "locality-hit",
            type: "circle",
            source: "localities",
            paint: {
              "circle-color": "#000000",
              "circle-opacity": 0.01,
              "circle-radius": 12,
            },
          });
          map.addLayer({
            id: "locality-circles",
            type: "circle",
            source: "localities",
            paint: {
              "circle-color": ["get", "color"],
              "circle-opacity": 0.9,
              "circle-radius": ["get", "radius"],
              "circle-stroke-color": ["get", "strokeColor"],
              "circle-stroke-width": ["get", "strokeWidth"],
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
              townName && !isUnnamedArea(townName)
                ? `<strong>${esc(townName)}</strong> · ${esc(t.districtOf(townDistrict ?? ""))}<br/>`
                : "";
            const dirAttr = locale === "ar" ? ` dir="rtl"` : "";
            const zoneName = (zoneId && regionLabel(zoneId, locale)) || zoneLabel;
            const m = zoneId ? mentionsFor(Number(get("year") || 2026) as Year, zoneId) : null;
            const html = m
              ? `<div${dirAttr} style="font-size:12px">${townLine}<strong>${esc(zoneName)}</strong><br/>${esc(t.tracedMentions(String(get("year") || 2026)))}<br/>` +
                layers(locale).map(
                  (l) => `<span style="color:${l.color}">■</span> ${esc(l.label)}: <strong>${m[l.id]}</strong>`,
                ).join("<br/>") +
                `<br/><em style="color:${CHART.label}">${esc(t.popupCaution)}</em></div>`
              : `<div${dirAttr} style="font-size:12px">${townLine}<strong>${esc(zoneName)}</strong></div>`;
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

          map.on("click", "locality-hit", (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (!f) return;
            const html = f.properties?.popupHtml as string;
            new maplibregl.Popup({ closeButton: true, maxWidth: "340px" })
              .setLngLat(e.lngLat)
              .setHTML(html)
              .addTo(map);
          });
          map.on("mouseenter", "locality-hit", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "locality-hit", () => {
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

    // The ground is neutral: one pin per entry already carries the
    // quantity, so shading the land by that same quantity said it twice
    // and set a colour ramp against the pins' own colours.
    if (map.getLayer("gov-fill")) {
      map.setPaintProperty("gov-fill", "fill-color", "#E1E7EE");
      map.setPaintProperty("gov-fill", "fill-opacity", 0.9);
    }
    for (const layerId of ["occupied-fill", "occupied-line"]) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", year === 2026 ? "visible" : "none");
      }
    }


    // One pin per traced entry, fanned around the town the reporting names.
    const geoTowns = glTownsRef.current;
    const idx = glIndexRef.current;
    const features: unknown[] = [];
    if (geoTowns && idx) {
      const byName = new Map(geoTowns.map((t) => [t.name, t] as const));
      const district = new Map(geoTowns.map((t) => [t.name, t.district] as const));
      const grouped = buildPins({
        entries: filteredRecords,
        index: idx,
        townDistrict: district,
        year,
        locale,
        spacing: PIN_SPACING_DEG,
      });
      for (const [name, pins] of grouped) {
        const town = byName.get(name);
        if (!town) continue;
        // Longitude degrees shrink with latitude; widen the x offset so the
        // fan stays circular on the ground rather than squashed.
        const lonScale = 1 / Math.max(0.2, Math.cos((town.lat * Math.PI) / 180));
        for (const pin of pins) {
          // The spiral knows nothing about the coast; keep the pin ashore.
          const land = glLandRef.current;
          const moved = clampToLand(town.lon, town.lat, pin.dx * lonScale, pin.dy, (x, y) =>
            land ? isOnLandIndexed(land, x, y) : isOnLand(x, y),
          );
          features.push({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [town.lon + moved.dx, town.lat + moved.dy],
            },
            properties: {
              name,
              radius: 6,
              // An episode is a ring, an entry a solid dot - the same
              // distinction the vector map draws.
              color: pin.kind === "episode" ? "#FFFFFF" : pin.color,
              strokeColor: pin.kind === "episode" ? pin.color : pinOutline(pin.color),
              strokeWidth: pin.kind === "episode" ? 2.4 : 1.2,
              popupHtml:
                `<div${locale === "ar" ? ` dir="rtl"` : ""} style="font-size:12px;line-height:1.5;max-width:300px">` +
                `<span style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:${CHART.label}">` +
                `${pin.kind === "episode" ? t.tracedEpisode : t.tracedEntry} · ${esc(pin.townName)}` +
                `${pin.district ? ` · ${esc(pin.district)}` : ""} · ${year}</span>` +
                `<br/><strong>${esc(pin.title)}</strong>` +
                `<br/><span style="display:inline-block;margin-top:3px;padding:1px 5px;border-radius:2px;background:${pin.kind === "episode" ? "#EEF2F7" : layerColor(pin.layer)};color:${pin.kind === "episode" ? "#173B63" : "#FFFFFF"};font-size:10px;font-weight:600">${esc(pin.layerLabel)}</span>` +
                `${pin.date ? ` <span style="font-size:10.5px;color:${CHART.label}">${esc(fmtDate(pin.date, locale))}</span>` : ""}` +
                (pin.kind === "entry"
                  ? `<br/><span style="font-size:11px;color:${CHART.label}">${esc(pin.detail)}</span>`
                  : "") +
                `<br/><span style="display:inline-block;margin-top:4px;white-space:normal">${esc(pin.body)}</span>` +
                `<br/><em style="font-size:10.5px;color:${CHART.label}">${esc(t.pinFoot)}</em></div>`,
            },
          });
        }
      }
    }
    const src = map.getSource("localities");
    if (src && "setData" in src) {
      (src as unknown as { setData: (d: unknown) => void }).setData({
        type: "FeatureCollection",
        features,
      });
    }
  }, [mapReady, filteredRecords, year, locale, t]);

  /*
   * `w-full` matters on a phone: a bare <select> is sized by its longest
   * option, and three of these exceed half the 343px line, so each one
   * claimed a row of its own. Filling a grid column instead lets them pair.
   */
  const selectCls =
    "min-h-11 w-full rounded-md border border-border bg-white px-2.5 text-sm text-text";

  const yearOptions = ["2024", "2026"] as const;
  const yearRoving = useRovingRadio({
    count: yearOptions.length,
    activeIndex: yearOptions.findIndex((y) => y === String(year)),
    onActivate: (i) => set("year", yearOptions[i]),
  });

  const nonMappable = locations.regions.filter((r) => !r.mappable);

  return (
    <div>
      {/* Controls */}
      {/*
        Not sticky on a phone. Pinned, this bar stood 453px tall under a
        65px header - 64% of a 812px viewport and 78% of a 667px one, before
        any map was visible. Letting it scroll away below sm costs nothing:
        a reader sets a filter and then wants the map, not the controls.
        Above sm it pins as before, with a cap so it can never do this again.
      */}
      <div className="z-40 -mx-4 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:sticky sm:top-[var(--header-h)] sm:max-h-[40vh] sm:overflow-y-auto sm:px-6">
        <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
          <div>
            <label htmlFor="map-year" className="block text-[11px] font-semibold text-text-secondary">
              {t.year}
            </label>
            <div className="mt-1 inline-flex overflow-hidden rounded-md border border-border bg-white" role="radiogroup" aria-label={t.mapYear}>
              {yearOptions.map((y, i) => (
                <button
                  key={y}
                  type="button"
                  role="radio"
                  aria-checked={String(year) === y}
                  {...yearRoving.itemProps(i)}
                  onClick={() => set("year", y)}
                  className={`min-h-11 px-4 text-sm ${
                    String(year) === y ? "font-semibold text-white" : "text-text-secondary"
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
            <label htmlFor="map-layer" className="block text-[11px] font-semibold text-text-secondary">
              {t.actorLayer}
            </label>
            <select id="map-layer" className={`mt-1 ${selectCls}`} value={layerFilter} onChange={(e) => set("layer", e.target.value)}>
              <option value="all">{t.allLayers}</option>
              {layers(locale).map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="map-stage" className="block text-[11px] font-semibold text-text-secondary">
              {t.stage}
            </label>
            <select id="map-stage" className={`mt-1 ${selectCls}`} value={stageFilter} onChange={(e) => set("stage", e.target.value)}>
              <option value="all">{t.allStages}</option>
              {stageList(locale).map((s, i) => (
                <option key={s} value={String(i + 1)}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="map-status" className="block text-[11px] font-semibold text-text-secondary">
              {t.status}
            </label>
            <select id="map-status" className={`mt-1 ${selectCls}`} value={statusFilter} onChange={(e) => set("status", e.target.value)}>
              <option value="all">{t.allStatuses}</option>
              {statusList(locale).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="map-comp" className="block text-[11px] font-semibold text-text-secondary">
              {t.comparability}
            </label>
            <select id="map-comp" className={`mt-1 ${selectCls}`} value={comparabilityFilter} onChange={(e) => set("comparability", e.target.value)}>
              <option value="all">{t.all}</option>
              {(["direct", "qualified", "not_comparable", "context_only"] as const).map((k) => (
                <option key={k} value={k}>{comparabilityLabel(k, locale)}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-md border border-border bg-white px-3 text-sm text-text-secondary hover:border-navy hover:text-navy"
          >
            {t.reset}
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
            className="min-h-11 rounded-md border border-border bg-white px-3 text-sm text-text-secondary hover:border-navy hover:text-navy"
          >
            {renderMode === "gl" ? t.backToVector : t.glOptIn}
          </button>
        </div>
      </div>

      <p className="mt-4 note-caution text-xs leading-relaxed text-text-secondary">
        {cautionMap(locale)}
      </p>

      {(
        <div className={`mt-4 grid gap-4 ${renderMode === "gl" ? "lg:grid-cols-[2fr_1fr]" : ""}`}>
          {renderMode === "svg" ? (
            <SvgLebanonMap
              year={year}
              regionValues={regionValues}
              maxRegion={maxRegion}
              rampColor={rampColor}
              records={filteredRecords}
              recordsAllYears={recordsAllYears}
              view={mapView}
              locale={locale}
            />
          ) : (
            <div dir="ltr" className="overflow-hidden rounded-md border border-border">
              <div
                ref={containerRef}
                className="h-[560px] sm:h-[760px]"
                aria-label={t.glAria(year)}
              />
            </div>
          )}

          {/* The key, then the groupings that cannot be put on a map at
              all. The reason they sit outside it is stated once for the
              group, not repeated on each card. */}
          <div className="space-y-3">
            {renderMode === "gl" && mapView === "entries" ? (
              <MapLegend locale={locale} />
            ) : null}
            {nonMappable.map((r) => {
              const m = mentionsFor(year, r.id);
              const total = m ? m.official + m.municipal + m.ngo_international + m.community : 0;
              return (
                <section key={r.id} className="card">
                  <h3 className="text-sm font-semibold text-navy">
                    {regionLabel(r.id, locale)}
                  </h3>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-navy">
                    {total}{" "}
                    <span className="text-xs font-normal text-text-secondary">
                      {t.mentionsIn(year)}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {layers(locale).map((l) => (
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
          aria-label={t.happenedAria(year)}
          className="mt-6 card"
        >
          <h3 className="text-base font-semibold text-navy">
            {t.happenedHead(year)}
          </h3>
          <p className="mt-1 max-w-3xl text-xs text-text-secondary">
            {t.happenedSub}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {LOCALITY_EVENTS.filter((l) => l.events.some((e) => e.year === year)).map((l) => (
              <article
                key={l.name}
                className="rounded-md border border-border p-3.5"
              >
                <h4 className="text-sm font-semibold text-navy">
                  {localityName(l, locale)}
                </h4>
                <ul className="mt-2 space-y-2">
                  {eventsFor(l, year).map((e, i) => {
                    const meta = EVENT_KIND_META[e.kind];
                    return (
                      <li key={i} className="text-[12.5px] leading-relaxed">
                        <span
                          className="me-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {eventKindLabel(e.kind, locale)}
                        </span>
                        {e.date ? (
                          <span className="me-1 font-semibold text-navy">
                            {fmtDate(e.date, locale)}:
                          </span>
                        ) : null}
                        {eventText(e, locale)}
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
