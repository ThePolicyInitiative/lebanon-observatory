"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { FilterSpecification, Map as MlMap, MapLayerMouseEvent } from "maplibre-gl";
import { CHART, LAYER_META, UI } from "@/lib/colors";
import { locations } from "@/lib/data-client";
import { COMPARABILITY_IN_USE, STATUSES_IN_USE, slimRecords } from "@/lib/map-records";
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
  featureAnchorLonLat,
  featureCentroidLonLat,
  isOnLand,
  isUnnamedArea,
  LITANI_SEGMENTS,
  unnamedAreaFilter,
  type GeoFeature,
} from "@/lib/geo";
import { buildLocationIndex, matchLocations, type LocationIndex } from "@/lib/geo-match";
import {
  LOCALITY_EVENTS,
  eventsByTown,
  eventsFor,
  eventText,
  localityName,
  EVENT_KIND_META,
} from "@/lib/events";
import { fmtDate } from "@/lib/format";
import {
  buildPins,
  chipBackground,
  clampToLand,
  degreesPerPixel,
  fanSpacing,
  fitSpacing,
  layerColor,
  pinOutline,
} from "@/lib/pins";

/** The drawn radius of one pin, and the gap two of them need to read apart. */
const GL_PIN_RADIUS = 6;
const GL_MIN_SEPARATION = 2 * GL_PIN_RADIUS + 1.2;

/** One marker on the pan-and-zoom map: a pin, or a town's counted cluster. */
type GlFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    name: string;
    /** Plain text for the focusable list, which has no HTML to read. */
    ariaLabel: string;
    /**
     * The same content as fields rather than markup, so the panel the
     * list opens is real text on the page. A MapLibre popup is appended
     * to the map's own overlay outside the React tree and announces
     * nothing; a reader who opened a marker from the list heard the
     * button they had just pressed and no more.
     */
    heading: string;
    town: string;
    district: string;
    detail: string;
    body: string;
    layerLabel: string;
    radius: number;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    popupHtml: string;
    /** Present on clusters only: the count drawn inside the marker. */
    label?: string;
  };
};
import { buildLandIndex, isOnLandIndexed, type LandIndex } from "@/lib/land";
import MapLegend from "./MapLegend";
import SvgLebanonMap, { eventKindLabel, type MapView } from "./SvgLebanonMap";


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

/**
 * The probe, answered once and remembered.
 *
 * useSyncExternalStore compares what getSnapshot returns, so it has to be
 * the same value every call rather than a fresh probe each time - and
 * building a throwaway canvas per render would be wasteful anyway.
 */
let glProbe: boolean | null = null;
function webglAvailableOnce(): boolean {
  if (glProbe === null) glProbe = webglAvailable();
  return glProbe;
}
/** Nothing to subscribe to: the answer cannot change within a page. */
const subscribeNever = () => () => {};
/**
 * Unknown on the server, so the button renders enabled there and the
 * markup the client hydrates against matches whatever it finds.
 */
const glUnknownOnServer = () => null;

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
    clusterNote: (n: number) =>
      `${n} traced entries here, closer together than they can be drawn apart at this zoom. Zoom in for a pin on each.`,
    pinListHeading: (n: number) =>
      `Every marker on the map as a list - ${n} in all. Selecting one brings it into view and opens what is traced there.`,
    filterStatus: (n: number, year: number) =>
      `${n} traced ${n === 1 ? "entry" : "entries"} in ${year} match the filters now set.`,
    listShow: (n: number) => `List all ${n} markers`,
    listHide: "Hide the marker list",
    noWebgl: "This browser cannot run the pan-and-zoom map. The vector map carries the same entries.",
    creditBoundaries: "Boundaries: OCHA Lebanon COD administrative boundaries",
    creditLitani: "Litani centreline © OpenStreetMap contributors (ODbL)",
    /** MapLibre's own control names, which it ships in English only. */
    mapLocale: {
      "Map.Title": "Map",
      "NavigationControl.ZoomIn": "Zoom in",
      "NavigationControl.ZoomOut": "Zoom out",
      "FullscreenControl.Enter": "Enter fullscreen",
      "FullscreenControl.Exit": "Exit fullscreen",
      "AttributionControl.ToggleAttribution": "Toggle attribution",
      "Popup.Close": "Close popup",
    },
    fellBack:
      "The pan-and-zoom map could not start, so the vector map is shown instead. It carries the same entries and names each region and district as text.",
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
    clusterNote: (n: number) =>
      `${n} مدخلاً مرصوداً هنا، أقرب بعضها إلى بعض من أن تُرسم متفرّقة عند هذا التكبير. قرّب الخريطة ليظهر دبّوس لكل مدخل.`,
    pinListHeading: (n: number) =>
      `كل علامة على الخريطة في قائمة - ${n} في المجموع. اختيار إحداها يجلبها إلى العرض ويفتح ما رُصد فيها.`,
    filterStatus: (n: number, year: number) =>
      `${n} مدخلاً مرصوداً في ${year} تطابق المرشّحات المضبوطة الآن.`,
    listShow: (n: number) => `اعرض العلامات كلها (${n})`,
    listHide: "إخفاء قائمة العلامات",
    noWebgl: "هذا المتصفّح لا يستطيع تشغيل خريطة التقريب والتحريك. والخريطة المتجهة تحمل المدخلات نفسها.",
    creditBoundaries: "الحدود: حدود لبنان الإدارية من بيانات OCHA COD",
    creditLitani: "مجرى نهر الليطاني © مساهمو OpenStreetMap (ODbL)",
    /** MapLibre's own control names, which it ships in English only. */
    mapLocale: {
      "Map.Title": "خريطة",
      "NavigationControl.ZoomIn": "تقريب",
      "NavigationControl.ZoomOut": "إبعاد",
      "FullscreenControl.Enter": "ملء الشاشة",
      "FullscreenControl.Exit": "إنهاء ملء الشاشة",
      "AttributionControl.ToggleAttribution": "إظهار نسب المصنّف",
      "Popup.Close": "إغلاق النافذة",
    },
    fellBack:
      "تعذّر تشغيل خريطة التقريب والتحريك، فعُرضت الخريطة المتجهة بدلاً منها. وهي تحمل المدخلات نفسها وتسمّي كل منطقة وقضاء نصّاً.",
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
  /**
   * The live year, readable from handlers that were registered once.
   * The GL map's governorate popup is bound inside a one-shot load
   * callback, so anything it closes over is frozen at that render.
   */
  const yearRef = useRef(year);
  useEffect(() => {
    yearRef.current = year;
  }, [year]);
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
  /**
   * Town centroids and the place-name index, set once the GL map loads
   * its data. State rather than refs: the markers are now worked out
   * during render so that they can also be listed as elements, and a ref
   * read during render is neither pure nor a reason to re-render when it
   * finally fills.
   */
  const [glTowns, setGlTowns] = useState<
    {
      name: string;
      district: string;
      lon: number;
      lat: number;
      feature: GeoFeature;
    }[] | null
  >(null);
  const [glIndex, setGlIndex] = useState<LocationIndex | null>(null);
  /** The dynamically imported MapLibre module, once the map has loaded. */
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  /**
   * The one popup the map may have open. Every place that opens one goes
   * through this, so opening a second closes the first rather than
   * stacking it and leaving the reader to dismiss both.
   */
  const popupRef = useRef<{ remove: () => void } | null>(null);
  /**
   * The list button that opened the current popup, so closing it returns
   * focus there instead of dropping it on <body>, which is where
   * MapLibre leaves it.
   */
  const popupOpenerRef = useRef<HTMLButtonElement | null>(null);
  /** The marker list's disclosure, and what it last opened. */
  const [listOpen, setListOpen] = useState(false);
  const [glOpen, setGlOpen] = useState<GlFeature | null>(null);
  const glPanelHeadingRef = useRef<HTMLHeadingElement | null>(null);
  /** Land test from the town polygons, in lon/lat. */
  const [glLand, setGlLand] = useState<LandIndex | null>(null);
  /**
   * Whether the vector map is showing because the pan-and-zoom one could
   * not start, rather than because the reader chose it. The substitution
   * used to be silent, which left the toggle asserting one thing and the
   * page showing another.
   */
  const [fellBack, setFellBack] = useState(false);
  /**
   * Whether this browser can give MapLibre a GL context. Null until the
   * probe runs, because it needs a document and the first render is on
   * the server - so the button is never disabled in the markup and then
   * enabled a moment later.
   */
  const glOk = useSyncExternalStore<boolean | null>(
    subscribeNever,
    webglAvailableOnce,
    glUnknownOnServer,
  );
  const [mapReady, setMapReady] = useState(false);
  const mapReadyRef = useRef(false);
  /**
   * The zoom the pins were last laid out for. Updated on zoomend rather
   * than on every frame: rebuilding four hundred points mid-gesture buys
   * nothing a reader can see, and the fan only has to be right when the
   * movement stops.
   */
  const [glZoom, setGlZoom] = useState(8);
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
        // A value nothing carries is not offered in the control, so it can
        // only arrive from an old link - and acting on it would empty the
        // map with no control left to undo it. Treated as no filter.
        if (
          statusFilter !== "all" &&
          STATUSES_IN_USE.has(statusFilter) &&
          r.implementationStatus !== statusFilter
        )
          return false;
        if (
          comparabilityFilter !== "all" &&
          COMPARABILITY_IN_USE.has(comparabilityFilter) &&
          r.comparability !== comparabilityFilter
        )
          return false;
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

  /**
   * The one way a popup is opened on this map.
   *
   * MapLibre closes its own popup - its close button, a click on the map
   * behind it - without telling the ref that held it. So the ref went on
   * pointing at a dead popup: Escape then "closed" something already
   * gone, swallowing the keypress and dragging focus back to whichever
   * list button had opened it, which by that point might not exist. The
   * close event puts the ref back to null, and every caller comes through
   * here so none of them can forget.
   *
   * Declared above the effect that uses it: the reference would resolve
   * at call time either way, but React's compiler reads the component
   * body in order and will not take a binding used before its line.
   */
  const showPopup = useCallback(
    (lngLat: [number, number], html: string, opener: HTMLButtonElement | null) => {
      const map = mapRef.current;
      const maplibregl = maplibreRef.current;
      if (!map || !maplibregl) return;
      popupRef.current?.remove();
      popupOpenerRef.current = opener;
      const popup = new maplibregl.Popup({ closeButton: true, maxWidth: "340px" })
        .setLngLat(lngLat)
        .setHTML(html)
        .addTo(map);
      popup.on("close", () => {
        if (popupRef.current === popup) popupRef.current = null;
      });
      popupRef.current = popup;
    },
    [],
  );

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
        // Kept so the focusable pin list can open the same popups the
        // pointer handlers do, without importing the library twice.
        maplibreRef.current = maplibregl;
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
          // MapLibre ships its control names in English only, so on the
          // Arabic page every one of them - zoom, fullscreen, the
          // attribution toggle, a popup's close button - was announced
          // and titled in English inside an otherwise Arabic map.
          locale: t.mapLocale,
          center: [35.65, 33.85],
          zoom: 7.3,
          minZoom: 6,
          // Far enough in that a busy town's fan can actually open. At 12 a
          // town like Nabatieh could never give its twenty-odd entries the
          // twelve pixels they need apart, so it stayed a single marker
          // however far the reader zoomed - which made the pins
          // unreachable rather than merely crowded.
          maxZoom: 15,
          attributionControl: false,
        });
        mapRef.current = map;
        // The credits for what this map actually draws.
        //
        // The control was added bare, and MapLibre hides it entirely when
        // no source declares an attribution - which none of these do,
        // being local GeoJSON. So the map drew OCHA COD boundaries and an
        // OpenStreetMap centreline with no credit anywhere on its face and
        // no way to reach one. The Litani geometry is ODbL, where
        // attribution is a licence term rather than a courtesy.
        //
        // A configured basemap style still contributes its own provider
        // line alongside these.
        map.addControl(
          new maplibregl.AttributionControl({
            compact: true,
            customAttribution: [t.creditBoundaries, t.creditLitani],
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
          // The centroid still anchors the choropleth popups; pins get the
          // pole of inaccessibility instead, resolved lazily below because
          // it is only worth computing for the thirty-odd towns the
          // tracking actually names.
          const townList = (towns.features as GeoFeature[]).map((f) => ({
            name: String(f.properties.adm3_name ?? ""),
            district: String(f.properties.adm2_name ?? ""),
            feature: f,
            ...featureCentroidLonLat(f),
          }));
          setGlTowns(townList);
          setGlIndex(buildLocationIndex(townList));
          // A cell of 0.02 degrees is roughly 2 km - a few polygons per
          // bucket, so a pin ray-casts a handful of rings, not 1,640.
          setGlLand(buildLandIndex(towns.features as GeoFeature[], 0.02));
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
          // The count inside a clustered town's marker. Only clusters
          // carry a label, so this layer is empty when every fan fits.
          // Glyphs are fetched from the style's font endpoint, which may
          // not be reachable; if it is not, the marker still shows and its
          // popup and accessible name still carry the number.
          map.addLayer({
            id: "locality-counts",
            type: "symbol",
            source: "localities",
            filter: ["has", "label"],
            layout: {
              "text-field": ["get", "label"],
              "text-size": 11,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            },
            paint: { "text-color": "#173B63" },
          });

          map.on("click", "gov-fill", (e: MapLayerMouseEvent) => {
            // A pin belongs to the pin. MapLibre's per-layer click
            // handlers are independent map-level listeners, each running
            // its own hit test, so nothing stops both from firing on one
            // click - and the governorate fill covers the whole country,
            // which puts it under 196 of the 200 pins. Every pin click was
            // opening its entry popup and a governorate popup underneath
            // it at the same point, so the reader had to dismiss a second
            // popup they never asked for.
            if (
              map.getLayer("locality-hit") &&
              map.queryRenderedFeatures(e.point, { layers: ["locality-hit"] }).length
            ) {
              return;
            }
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
            // yearRef, not get("year"): this handler is registered once,
            // inside the one-shot load callback, so it closes over that
            // render's get and keeps answering with the year that was
            // showing when the map loaded. Reading the URL rather than
            // the prop looked like a way to stay current and was not -
            // the closure is what is frozen, not the value. A ref is read
            // at click time, so it survives the one-shot registration.
            const popupYear = yearRef.current;
            const m = zoneId ? mentionsFor(popupYear, zoneId) : null;
            const html = m
              ? `<div${dirAttr} style="font-size:12px">${townLine}<strong>${esc(zoneName)}</strong><br/>${esc(t.tracedMentions(String(popupYear)))}<br/>` +
                layers(locale).map(
                  (l) => `<span style="color:${l.color}">■</span> ${esc(l.label)}: <strong>${m[l.id]}</strong>`,
                ).join("<br/>") +
                `<br/><em style="color:${CHART.label}">${esc(t.popupCaution)}</em></div>`
              : `<div${dirAttr} style="font-size:12px">${townLine}<strong>${esc(zoneName)}</strong></div>`;
            // A pointer opened this one, so there is no list button to
            // send focus back to.
            showPopup([e.lngLat.lng, e.lngLat.lat], html, null);
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
            showPopup([e.lngLat.lng, e.lngLat.lat], html, null);
          });
          map.on("mouseenter", "locality-hit", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "locality-hit", () => {
            map.getCanvas().style.cursor = "";
          });

          // Re-fan the pins for the new scale once a zoom gesture settles.
          map.on("zoomend", () => setGlZoom(map.getZoom()));

          mapReadyRef.current = true;
          setGlZoom(map.getZoom());
          setMapReady(true);
        });
      } catch {
        // Involuntary: say so rather than quietly showing the other map.
        setFellBack(true);
        setRenderMode("svg");
      }
    }
    void init();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      // The map is gone, so the session state that described it has to go
      // too. Leaving mapReady true meant that on a second visit every
      // dependency of the pin effect was identical to the first - the
      // filters untouched, the locale the same, the zoom back at its
      // configured default - so React had no reason to re-run it, and the
      // localities source stayed at the empty collection it is created
      // with. The reader got boundaries and no pins, with no error to
      // explain it, until they happened to touch a filter.
      mapReadyRef.current = false;
      setMapReady(false);
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
          setFellBack(true);
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

  /**
   * The fan anchor for every town the tracking can reach.
   *
   * The pole of inaccessibility is a grid search per town - about 1.2 ms,
   * and 1.9 seconds if run over the whole cadastre - so it is worked out
   * for the thirty-odd towns that can carry a marker and no others. The
   * set does not depend on the filters: a town filtered out of view still
   * has the same anchor when it comes back, so this survives every filter
   * and zoom change and is recomputed only when the boundaries load.
   */
  const glAnchors = useMemo(() => {
    const m = new Map<string, { lon: number; lat: number; room: number }>();
    if (!glTowns || !glIndex) return m;
    const byName = new Map(glTowns.map((t) => [t.name, t] as const));
    const needed = new Set<string>();
    for (const r of slimRecords)
      for (const town of matchLocations(glIndex, r.locationNames ?? []).towns) needed.add(town);
    for (const [town] of eventsByTown) needed.add(town);
    for (const name of needed) {
      const town = byName.get(name);
      if (!town) continue;
      const a = featureAnchorLonLat(town.feature);
      // A degenerate polygon leaves no room at all; fall back to the
      // centroid the rest of the map already uses.
      m.set(name, a.room > 0 ? a : { lon: town.lon, lat: town.lat, room: 0 });
    }
    return m;
  }, [glTowns, glIndex]);

  /**
   * Every marker the map draws, as GeoJSON features.
   *
   * Built here rather than inside the effect that uploads them, because
   * the same list is also rendered as a focusable list beside the canvas.
   * Pins are drawn into WebGL and have no DOM node of their own, so
   * without that list there is nothing for a keyboard reader to reach and
   * no way to open a single one of them.
   *
   */
  const glFeatures = useMemo<GlFeature[]>(() => {
    const geoTowns = glTowns;
    const idx = glIndex;
    const features: GlFeature[] = [];
    if (geoTowns && idx) {
      const district = new Map(geoTowns.map((t) => [t.name, t.district] as const));
      const anchorFor = (name: string) => glAnchors.get(name) ?? null;

      const grouped = buildPins({
        entries: filteredRecords,
        index: idx,
        townDistrict: district,
        year,
        locale,
        // Two ceilings, whichever is lower: the scale-based spacing, so the
        // fan reads the same at any zoom, and the town's own room, so it
        // never reaches past the boundary of the place it names.
        spacing: (name, count) => {
          const anchor = anchorFor(name);
          return fitSpacing(count, anchor?.room ?? 0, fanSpacing(glZoom));
        },
      });
      for (const [name, pins] of grouped) {
        const anchor = anchorFor(name);
        if (!anchor) continue;

        // A pin is twelve pixels across. Where the town's own room cannot
        // hold its entries that far apart, drawing them separately would
        // either pile them into one blob or push them into the next town,
        // so the town is drawn as a single marker carrying its count and
        // the fan opens only once there is room for it. The count is true
        // at every zoom; the fan is only true when it fits.
        const spacing = fitSpacing(pins.length, anchor.room, fanSpacing(glZoom));
        if (pins.length > 1 && spacing / degreesPerPixel(glZoom) < GL_MIN_SEPARATION) {
          const district = pins[0].district;
          features.push({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [anchor.lon, anchor.lat] },
            properties: {
              name,
              label: String(pins.length),
              ariaLabel: `${name}${district ? `, ${district}` : ""} - ${t.clusterNote(pins.length)}`,
              heading: t.clusterNote(pins.length),
              town: name,
              district,
              detail: "",
              body: t.clusterNote(pins.length),
              layerLabel: "",
              radius: GL_PIN_RADIUS + Math.sqrt(pins.length) * 1.6,
              color: "#FFFFFF",
              strokeColor: UI.outlineQuiet,
              strokeWidth: 1.4,
              popupHtml:
                `<div${locale === "ar" ? ` dir="rtl"` : ""} style="font-size:12px;line-height:1.5;max-width:300px">` +
                `<strong>${esc(name)}</strong>${district ? ` <span style="color:${CHART.label}">· ${esc(district)}</span>` : ""}` +
                `<br/><span style="white-space:normal">${esc(t.clusterNote(pins.length))}</span></div>`,
            },
          });
          continue;
        }

        // Longitude degrees shrink with latitude; widen the x offset so the
        // fan stays circular on the ground rather than squashed.
        const lonScale = 1 / Math.max(0.2, Math.cos((anchor.lat * Math.PI) / 180));
        for (const pin of pins) {
          // The spiral knows nothing about the coast; keep the pin ashore.
          const land = glLand;
          const moved = clampToLand(anchor.lon, anchor.lat, pin.dx * lonScale, pin.dy, (x, y) =>
            land ? isOnLandIndexed(land, x, y) : isOnLand(x, y),
          );
          features.push({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [anchor.lon + moved.dx, anchor.lat + moved.dy],
            },
            properties: {
              name,
              ariaLabel:
                `${pin.kind === "episode" ? t.tracedEpisode : t.tracedEntry}: ` +
                `${pin.title} - ${pin.townName}${pin.district ? `, ${pin.district}` : ""}` +
                `${pin.kind === "entry" ? ` · ${pin.detail}` : ""}`,
              heading: pin.title,
              town: pin.townName,
              district: pin.district,
              detail: pin.kind === "entry" ? pin.detail : "",
              body: pin.body,
              layerLabel: pin.layerLabel,
              radius: GL_PIN_RADIUS,
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
                `<br/><span style="display:inline-block;margin-top:3px;padding:1px 5px;border-radius:2px;background:${pin.kind === "episode" ? "#EEF2F7" : chipBackground(layerColor(pin.layer))};color:${pin.kind === "episode" ? "#173B63" : "#FFFFFF"};font-size:10px;font-weight:600">${esc(pin.layerLabel)}</span>` +
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
    return features;
  }, [glTowns, glIndex, glLand, glAnchors, filteredRecords, year, locale, t, glZoom]);

  /**
   * Escape dismisses the pan-and-zoom map's popup.
   *
   * MapLibre 6.1 binds no key handling to a popup, so the only way out
   * was clicking its close button or clicking the map behind it - which
   * a keyboard reader cannot do, and which left the popup standing over
   * the map for anyone who reached for Escape first.
   */
  useEffect(() => {
    if (renderMode !== "gl") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !popupRef.current) return;
      popupRef.current.remove();
      popupRef.current = null;
      // Back to whatever opened it, when that was the hidden list.
      popupOpenerRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [renderMode]);

  /**
   * Open one marker from the focusable list: bring it into view and show
   * the same popup a pointer click would have opened.
   */
  const openGlFeature = useCallback((f: GlFeature) => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl) return;
    const [lon, lat] = f.geometry.coordinates;
    // A cluster is a whole town; a pin is one entry, so go in far enough
    // that its fan has opened and the pin means what it says.
    map.easeTo({
      center: [lon, lat],
      zoom: f.properties.label ? Math.max(map.getZoom(), 11) : Math.max(map.getZoom(), 13),
    });
    showPopup([lon, lat], f.properties.popupHtml, popupOpenerRef.current);
    // And the same content as text on the page, which is the half a
    // screen reader can follow - a MapLibre popup lives in the map's own
    // overlay, outside the React tree and outside anything announced.
    setGlOpen(f);
  }, [showPopup]);

  // Focus the panel the list opened, once it exists.
  useEffect(() => {
    if (glOpen) glPanelHeadingRef.current?.focus();
  }, [glOpen]);

  // Paint the ground, then hand the markers to the source.
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

    const src = map.getSource("localities");
    if (src && "setData" in src) {
      (src as unknown as { setData: (d: unknown) => void }).setData({
        type: "FeatureCollection",
        features: glFeatures,
      });
    }
  }, [mapReady, glFeatures, year]);

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
              {/* Only statuses entries carry - see STATUSES_IN_USE. */}
              {statusList(locale)
                .filter(([k]) => STATUSES_IN_USE.has(k))
                .map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
            </select>
          </div>
          {/* Only worth offering while there is more than one grade to
              choose between. See COMPARABILITY_IN_USE. */}
          {COMPARABILITY_IN_USE.size > 1 ? (
            <div>
              <label htmlFor="map-comp" className="block text-[11px] font-semibold text-text-secondary">
                {t.comparability}
              </label>
              <select id="map-comp" className={`mt-1 ${selectCls}`} value={comparabilityFilter} onChange={(e) => set("comparability", e.target.value)}>
                <option value="all">{t.all}</option>
                {(["direct", "qualified", "not_comparable", "context_only"] as const)
                  .filter((k) => COMPARABILITY_IN_USE.has(k))
                  .map((k) => (
                    <option key={k} value={k}>{comparabilityLabel(k, locale)}</option>
                  ))}
              </select>
            </div>
          ) : null}
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
              // A deliberate switch is not a failure; clear the notice.
              setFellBack(false);
              if (renderMode === "gl") setRenderMode("svg");
              else setRenderMode("gl");
            }}
            aria-pressed={renderMode === "gl"}
            // Without WebGL the click used to fall through the else-if and
            // do nothing at all - a control that looks live, gives no
            // feedback and changes nothing, in either language. Saying it
            // cannot run is better than appearing to ignore the reader.
            disabled={renderMode !== "gl" && glOk === false}
            className="min-h-11 rounded-md border border-border bg-white px-3 text-sm text-text-secondary hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:text-text-secondary"
          >
            {renderMode === "gl" ? t.backToVector : t.glOptIn}
          </button>
          {renderMode !== "gl" && glOk === false ? (
            <p className="mt-1 text-micro text-text-secondary">{t.noWebgl}</p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 note-caution text-xs leading-relaxed text-text-secondary">
        {cautionMap(locale)}
      </p>

      {/*
       * Always mounted, and outside the branch that swaps the two maps.
       *
       * A live region only announces changes made to a region that was
       * already there when the page settled - mount the region and its
       * text together and the text is just part of the initial render,
       * which is silent. The map's only result count was doing exactly
       * that, and it lived inside the vector map, so in pan-and-zoom mode
       * there was no count at all. Changing a filter said nothing in
       * either mode.
       */}
      <p role="status" className="sr-only">
        {t.filterStatus(filteredRecords.length, year)}
      </p>

      {/* Visible as well as announced: a reader who asked for the
          pan-and-zoom map and got the other one is owed the reason. */}
      {fellBack && renderMode === "svg" ? (
        <p role="status" className="note-caution mt-3 text-meta">
          {t.fellBack}
        </p>
      ) : null}

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
            <>
            <div dir="ltr" className="overflow-hidden rounded-md border border-border">
              {/*
               * dir stays ltr on this wrapper: the canvas is WebGL, so
               * CSS direction cannot mirror it, the controls position
               * themselves with physical properties, and every popup sets
               * its own dir from the locale - so no Arabic text depends
               * on it. The vector map is the one that needed unpicking.
               *
               * role="region" so the description is actually announced.
               * A bare div maps to ARIA generic, which takes no
               * accessible name, so t.glAria - the sentence that tells a
               * screen-reader reader this map takes keyboard pan and zoom
               * and that the vector map beside it names every region as
               * text - was being dropped on the floor. All that was
               * announced was MapLibre's own three-character "Map".
               *
               * The label is rendered by React rather than passed to
               * MapLibre's locale option, because it names the year and
               * the year changes; anything handed to the constructor
               * would be frozen at the year the map was built with.
               */}
              <div
                ref={containerRef}
                role="region"
                className="h-[560px] sm:h-[760px]"
                aria-label={t.glAria(year)}
              />
            </div>

            {/*
             * The same markers, as something a keyboard can reach.
             *
             * Pins are drawn into the WebGL canvas, so none of them is an
             * element: nothing takes focus, and the only thing that opened
             * one was a pointer click. This list is the map's content in
             * the one form that can be tabbed through and read aloud.
             *
             * It was sr-only, which was the wrong shape twice over. Hidden
             * text that still takes focus gives a sighted keyboard reader
             * up to two hundred stops at which nothing appears to happen,
             * and it gave everyone two hundred stops between the map and
             * whatever came after it. Behind a disclosure it is one stop
             * until asked for, and visible to whoever opens it.
             */}
            <div className="mt-2">
              <button
                type="button"
                aria-expanded={listOpen}
                aria-controls="gl-marker-list"
                onClick={() => setListOpen((v) => !v)}
                className="min-h-11 rounded-md border border-border bg-white px-3 text-sm text-text-secondary hover:border-navy hover:text-navy"
              >
                {listOpen ? t.listHide : t.listShow(glFeatures.length)}
              </button>
              <div id="gl-marker-list" hidden={!listOpen}>
                <p className="mt-2 text-micro text-text-secondary">
                  {t.pinListHeading(glFeatures.length)}
                </p>
                <ul className="mt-1 max-h-64 overflow-y-auto rounded-md border border-border">
                  {glFeatures.map((f, i) => (
                    <li key={`${f.properties.name}-${i}`} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          popupOpenerRef.current = e.currentTarget;
                          openGlFeature(f);
                        }}
                        className="flex w-full items-baseline gap-2 px-2 py-1.5 text-start text-[12px] hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-blue"
                      >
                        <span
                          aria-hidden
                          className="mt-1 h-2 w-2 shrink-0 rounded-sm"
                          style={{ background: f.properties.color }}
                        />
                        <span className="min-w-0">{f.properties.ariaLabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/*
             * What the list opened, as text on the page.
             *
             * A MapLibre popup is appended to the map's own overlay,
             * outside the React tree and outside anything a screen reader
             * follows - so a reader who activated a marker heard the
             * button they had just pressed and nothing else. This says the
             * same thing where it can be read, and it survives the list
             * rebuilding underneath it when the map eases to a new zoom.
             */}
            {glOpen ? (
              <aside
                className="card mt-2 border-s-4"
                style={{ borderInlineStartColor: glOpen.properties.color }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setGlOpen(null);
                    popupOpenerRef.current?.focus();
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                      {glOpen.properties.town}
                      {glOpen.properties.district ? ` · ${glOpen.properties.district}` : ""}
                    </p>
                    <h3
                      ref={glPanelHeadingRef}
                      tabIndex={-1}
                      className="mt-1 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-blue"
                    >
                      {glOpen.properties.heading}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGlOpen(null);
                      popupOpenerRef.current?.focus();
                    }}
                    aria-label={t.mapLocale["Popup.Close"]}
                    className="shrink-0 rounded-sm px-1.5 text-text-secondary hover:text-navy"
                  >
                    ×
                  </button>
                </div>
                {glOpen.properties.layerLabel ? (
                  <p className="mt-1">
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ background: chipBackground(glOpen.properties.color) }}
                    >
                      {glOpen.properties.layerLabel}
                    </span>
                  </p>
                ) : null}
                {glOpen.properties.detail ? (
                  <p className="mt-1 text-[11px] text-text-secondary">{glOpen.properties.detail}</p>
                ) : null}
                <p className="mt-1 text-[12px] text-text">{glOpen.properties.body}</p>
                <p className="mt-1 text-micro text-text-secondary">{t.pinFoot}</p>
              </aside>
            ) : null}
            </>
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
