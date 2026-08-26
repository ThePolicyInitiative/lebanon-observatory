"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHART, LAYER_META, UI, VALENCE } from "@/lib/colors";
import { locations } from "@/lib/data-client";
import type { SlimRecord } from "@/lib/map-records";
import {
  DISTRICT_PATHS,
  DISTRICT_LABELS,
  GOV_PATHS,
  CITY_LABELS,
  LITANI_PATHS,
  OCCUPIED_COD_DISTRICTS_2026,
  computeBorderStripTowns,
  dissolveBoundary,
  AFFECTED_ZONE_IDS,
  zoneForCodAdm1,
  toSvgPath,
  projectPoint,
  featureAnchor,
  featureCentroid,
  isOnLand,
  isUnnamedArea,
  unprojectPoint,
  PX_PER_KM,
  VIEW_W,
  VIEW_H,
  type GeoFeature,
} from "@/lib/geo";
import type { ActorLayer, Year } from "@/lib/types";
import { buildLocationIndex, matchLocations } from "@/lib/geo-match";
import destruction from "@/data/destruction.json";
import districtDamage from "@/data/district-damage.json";
import {
  eventsByTown,
  eventsFor,
  eventText,
  EVENT_KIND_META,
  type MapEvent,
} from "@/lib/events";
import { fmtDate } from "@/lib/format";
import { layers, regionLabel, stageList, type Locale } from "@/lib/vocab";
import {
  buildPins,
  clampToLand,
  fanRadius,
  fitSpacing,
  pinOutline,
  type Pin,
} from "@/lib/pins";
import { buildLandIndex, isOnLandIndexed, type LandIndex } from "@/lib/land";
import MapLegend from "./MapLegend";
import ViewRanking, { type RankRow } from "./ViewRanking";

/**
 * Fan geometry, in screen pixels. Nearest-neighbour distance on the
 * spiral is exactly PIN_SPACING, so it has to clear the pin's drawn
 * diameter of 2 x (radius + half the outline) = 7.4, leaving a 1.6px lane
 * of ground between neighbours.
 *
 * PIN_HIT is half the spacing, so the invisible hit circles tile the fan
 * exactly: every point belongs to its nearest pin, with no dead ground
 * between targets and no two targets fighting over a click.
 */
const PIN_SPACING = 9;
const PIN_R = 3.2;
const PIN_STROKE = 1;
const PIN_HIT = PIN_SPACING / 2;

const PIN_T = {
  en: {
    pinCount: (pins: number, places: number) =>
      `${pins} pins across ${places} places - select one for its entry`,
    entryAt: "Traced entry ·",
    episodeAt: "Traced episode ·",
    close: "Close this entry",
    pinNote:
      "One pin, one traced entry. The pin sits in the town the reporting names, fanned off its centre so neighbouring entries stay separate - it is not a street address.",
    happenedHere: "What happened here",
    findTown: (n: string) => `Find a town (${n} cadastral towns - selecting zooms to it)`,
    loading: "loading",
    searchPlaceholder: "e.g. Aaintaroun (Bent Jbeil)",
    zoomReadout: (z: string) => `×${z} zoom`,
    mapAria: (year: number, occupation: boolean) =>
      `Town-level map of Lebanon shaded by located traced activities for ${year}.${occupation ? " Hatched towns form the Blue Line border strip with traced Israeli occupation." : ""} Zoom with the wheel, drag or double-click; use the town search box for keyboard access to individual towns.`,
    baseTitle: (name: string, zone: string, v: number, year: number) =>
      `${name} - ${zone}: ${v} mentions (${year})`,
    area: (name: string, district: string) => `${name} · ${district} district`,
    hoverChange: (name: string, district: string, y24: number, y26: number) =>
      `${name} · ${district} district - activity ${y24} → ${y26} (${y26 - y24 >= 0 ? "+" : ""}${y26 - y24})`,
    hoverSurvey: (name: string, district: string, units: string, completeShare?: number) =>
      `${name} · ${district} district - ${units} housing units reported damaged (Dec 2024 municipal survey)${completeShare ? `, ${completeShare}% completely damaged` : ""}`,
    hoverSurveyNone: (name: string, district: string) =>
      `${name} · ${district} district - not among the districts named in the December 2024 municipal survey`,
    hoverDamage: (name: string, district: string) =>
      `${name} · ${district} district - select for assessment details`,
    hoverEntries: (name: string, district: string, dCount: number, namedCount: number) =>
      `${name} · ${district} district - ${dCount} traced activit${dCount === 1 ? "y" : "ies"} in this district${namedCount > 0 ? `, ${namedCount} naming this town` : ""}`,
    stripSuffix: " · Blue Line border strip (occupation)",
    occupiedSuffix: " · district contains occupied areas",
    unnamed: "Unnamed or disputed area (boundary data)",
    overviewAria: "Overview map - click to recentre the view",
    km: "km",
    dahieh: "Dahieh belt: 93% of Beirut–ML debris",
    dmgAria: (label: string, n: string) =>
      `${label}: ${n} buildings completely destroyed in the 2026 assessment`,
    dmgTitle: (label: string, n: string) =>
      `${label}: ${n} buildings completely destroyed - South of the Litani assessment, 29 April 2026 imagery, desk-validated`,
    stageTip: (no: number, name: string, c: number) =>
      `${no}. ${name}: ${c} entry${c === 1 ? "" : "s"}`,
    stagesCaption: (present: number) =>
      `value-chain stages 1–12 (hover for names) - ${present} of 12 present`,
    zoneScaleNote:
      "Mention counts are traced at the regional-grouping level; town boundaries are shown for geographic orientation.",
    mentionsCaution:
      "Mentions in the tracking - not damage severity, expenditure or coverage.",
    whoLink: "Who did what here →",
    explorerLink: "Open the data explorer →",
    changeMorePins: "more located entries in 2026 than 2024",
    changeFewerPins: (maxAbs: number) =>
      `fewer than 2024 - darker = larger change (max ±${maxAbs})`,
    surveyLegend: (max: string) =>
      `housing units reported damaged by municipalities, December 2024 (0-${max} per district)`,
    damageLegend: "buildings completely destroyed, worst cadasters (2026 assessment)",
    stripLegend: "Blue Line border-strip towns - traced occupation (2026)",
    stripDistrictsLegend: "districts containing the strip",
    completeShare: (pct: number) => `${pct}% complete`,
  },
  ar: {
    pinCount: (pins: number, places: number) =>
      `${pins} دبّوساً في ${places} مكاناً - اختر واحداً لعرض مدخله`,
    entryAt: "مدخل مرصود ·",
    episodeAt: "واقعة مرصودة ·",
    close: "إغلاق هذا المدخل",
    pinNote:
      "دبّوس واحد لمدخل مرصود واحد. والدبّوس يقع في البلدة التي يسمّيها الإبلاغ، منشوراً عن مركزها ليبقى كل مدخل منفصلاً - وهو ليس عنواناً في شارع.",
    happenedHere: "ما الذي جرى هنا",
    findTown: (n: string) => `ابحث عن بلدة (${n} بلدة عقارية - اختيارها يقرّب الخريطة إليها)`,
    loading: "قيد التحميل",
    searchPlaceholder: "مثال: Aaintaroun (Bent Jbeil)",
    zoomReadout: (z: string) => `تكبير ×${z}`,
    mapAria: (year: number, occupation: boolean) =>
      `خريطة لبنان على مستوى البلدات مظلَّلة بالنشاط المرصود المحدَّد الموقع لسنة ${year}.${occupation ? " البلدات المخطَّطة تشكّل شريط الخط الأزرق الحدودي حيث رُصد احتلال إسرائيلي." : ""} قرّب بالعجلة أو السحب أو النقر المزدوج؛ ومربّع البحث عن بلدة يتيح الوصول إلى البلدات بلوحة المفاتيح.`,
    baseTitle: (name: string, zone: string, v: number, year: number) =>
      `${name} - ${zone}: ${v} إشارة (${year})`,
    area: (name: string, district: string) => `${name} · قضاء ${district}`,
    hoverChange: (name: string, district: string, y24: number, y26: number) =>
      `${name} · قضاء ${district} - النشاط من ${y24} إلى ${y26} (${y26 - y24 >= 0 ? "+" : ""}${y26 - y24})`,
    hoverSurvey: (name: string, district: string, units: string, completeShare?: number) =>
      `${name} · قضاء ${district} - ${units} وحدة سكنية أُبلغ عن تضرّرها (مسح البلديات، كانون الأول 2024)${completeShare ? `، منها ${completeShare}% متضرّرة كلياً` : ""}`,
    hoverSurveyNone: (name: string, district: string) =>
      `${name} · قضاء ${district} - ليس من الأقضية المسمّاة في مسح البلديات في كانون الأول 2024`,
    hoverDamage: (name: string, district: string) =>
      `${name} · قضاء ${district} - اختره لتفاصيل التقييم`,
    hoverEntries: (name: string, district: string, dCount: number, namedCount: number) =>
      `${name} · قضاء ${district} - ${dCount} نشاطاً مرصوداً في هذا القضاء${namedCount > 0 ? `، منها ${namedCount} يسمّي هذه البلدة` : ""}`,
    stripSuffix: " · شريط الخط الأزرق الحدودي (احتلال)",
    occupiedSuffix: " · قضاء يضم مناطق محتلة",
    unnamed: "منطقة بلا اسم أو متنازَع عليها (معطيات الحدود)",
    overviewAria: "خريطة عامة - انقر لإعادة توسيط العرض",
    km: "كم",
    dahieh: "حزام الضاحية: 93% من ركام بيروت وجبل لبنان",
    dmgAria: (label: string, n: string) =>
      `${label}: ${n} مبنى مدمَّراً كلياً في تقييم 2026`,
    dmgTitle: (label: string, n: string) =>
      `${label}: ${n} مبنى مدمَّراً كلياً - تقييم جنوب الليطاني، صور 29 نيسان 2026، بتدقيق مكتبي`,
    stageTip: (no: number, name: string, c: number) => `${no}. ${name}: ${c} مدخل`,
    stagesCaption: (present: number) =>
      `مراحل سلسلة القيمة 1-12 (مرّر المؤشر للأسماء) - ${present} من 12 حاضرة`,
    zoneScaleNote:
      "أعداد الإشارات مرصودة على مستوى التجمّع الإقليمي؛ وحدود البلدات معروضة للتوجيه الجغرافي.",
    mentionsCaution: "إشارات في التتبّع - لا شدّة الضرر ولا الإنفاق ولا التغطية.",
    whoLink: "من فعل ماذا هنا ←",
    explorerLink: "افتح مستكشف المدخلات ←",
    changeMorePins: "مدخلات محدَّدة الموقع في 2026 أكثر منها في 2024",
    changeFewerPins: (maxAbs: number) =>
      `أقل من 2024 - الأغمق يعني تبدّلاً أكبر (الحد الأقصى ±${maxAbs})`,
    surveyLegend: (max: string) =>
      `وحدات سكنية أُبلغ عن تضرّرها من البلديات، كانون الأول 2024 (0-${max} لكل قضاء)`,
    damageLegend: "أبنية مدمَّرة كلياً، أسوأ العقارات (تقييم 2026)",
    stripLegend: "بلدات شريط الخط الأزرق الحدودي - احتلال مرصود (2026)",
    stripDistrictsLegend: "أقضية تضم الشريط",
    completeShare: (pct: number) => `${pct}% تضرّر كلي`,
  },
} as const;

/** Arabic chip labels for the traced-episode kinds; EN keeps EVENT_KIND_META. */
const KIND_AR: Record<MapEvent["kind"], string> = {
  official: "رسمي",
  municipal: "بلدي",
  ngo_international: "دولي / غير حكومي",
  community: "أهلي",
  context: "سياق الحرب",
};

export function eventKindLabel(kind: MapEvent["kind"], locale: Locale): string {
  return locale === "ar" ? KIND_AR[kind] : EVENT_KIND_META[kind].label;
}

function EventsList({ events, locale = "en" }: { events: MapEvent[]; locale?: Locale }) {
  if (events.length === 0) return null;
  return (
    <div className="mt-3 border-t border-dashed border-border pt-2.5">
      <h4 className="text-xs font-bold uppercase tracking-wide text-text-secondary">
        {PIN_T[locale].happenedHere}
      </h4>
      <ul className="mt-1.5 space-y-2">
        {events.map((e, i) => {
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
    </div>
  );
}

type Props = {
  year: Year;
  regionValues: Record<string, number>;
  maxRegion: number;
  rampColor: string;
  /** All entries under the current filters, for district-level shading. */
  records: SlimRecord[];
  /** Entries under the non-year filters, both years (change view). */
  recordsAllYears: SlimRecord[];
  view: MapView;
  note?: string;
  locale?: Locale;
};

export type MapView = "entries" | "change" | "survey" | "damage";

/** Municipality-reported damaged housing units, December 2024 survey. */
const SURVEY_BY_DISTRICT = new Map(
  districtDamage.districts.map((d) => [d.codName, d]),
);
const SURVEY_MAX = Math.max(...districtDamage.districts.map((d) => d.units));

type Town = {
  /** Unique per polygon (names are not unique in the boundary data). */
  uid: string;
  d: string;
  name: string;
  district: string;
  zoneId: string;
  /** In a district traced as containing occupied areas (2026). */
  occupied: boolean;
  /** On the Blue Line border strip itself (derived from the geometry). */
  strip: boolean;
  cx: number;
  cy: number;
  /**
   * Where this town's pins are fanned from, and how much room the fan has
   * before it reaches the boundary. Not the centroid: that is the average
   * of a shape rather than a point inside it, and for a coastal sliver
   * like Sour it sits 54 m from its own edge, which put entries in the
   * next town along. See poleOfInaccessibility.
   */
  ax: number;
  ay: number;
  room: number;
};

type ViewBox = { x: number; y: number; w: number; h: number };

const ASPECT = VIEW_H / VIEW_W;
const HOME: ViewBox = { x: 0, y: 0, w: VIEW_W, h: VIEW_H };
const MIN_W = VIEW_W / 18;

function clampVb(x: number, y: number, w: number): ViewBox {
  const cw = Math.min(Math.max(w, MIN_W), VIEW_W);
  const ch = cw * ASPECT;
  return {
    x: Math.min(Math.max(x, 0), VIEW_W - cw),
    y: Math.min(Math.max(y, 0), VIEW_H - ch),
    w: cw,
    h: ch,
  };
}

function zoomAt(cur: ViewBox, cx: number, cy: number, factor: number): ViewBox {
  const nw = Math.min(Math.max(cur.w * factor, MIN_W), VIEW_W);
  const r = nw / cur.w;
  return clampVb(cx - (cx - cur.x) * r, cy - (cy - cur.y) * r, nw);
}

function vbAround(cx: number, cy: number, w: number): ViewBox {
  return clampVb(cx - w / 2, cy - (w * ASPECT) / 2, w);
}


/**
 * Vector map at town (cadastre) detail: 1,600+ town polygons from the
 * OCHA COD boundary data shaded by their regional grouping's value,
 * with wheel/drag/button zoom and pan, district outlines and labels,
 * city labels, markers on the towns work is traced in, diamonds on
 * towns with traced episodes, a hover readout, a scale bar, and
 * hatching over border districts containing Israeli-occupied areas
 * (2026). The district base renders from server HTML instantly; the
 * town layer loads over it.
 */
export default function SvgLebanonMap({
  year,
  regionValues,
  maxRegion,
  rampColor,
  records,
  recordsAllYears,
  view,
  note,
  locale = "en",
}: Props) {
  const tr = PIN_T[locale];
  const [towns, setTowns] = useState<Town[] | null>(null);
  /** Land test built from the town polygons the map itself draws. */
  const [landIndex, setLandIndex] = useState<LandIndex | null>(null);
  const [openPin, setOpenPin] = useState<(Pin & { town: Town }) | null>(null);
  const [districtOutlines, setDistrictOutlines] = useState<
    { name: string; d: string }[]
  >([]);
  const [govOutlines, setGovOutlines] = useState<string[]>([]);
  const [stripOutline, setStripOutline] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedTownRaw, setSelectedTownRaw] = useState<string | null>(null);
  const [selectedTownUid, setSelectedTownUid] = useState<string | null>(null);
  const [selectedOccupation, setSelectedOccupation] = useState<"" | "strip" | "district">("");
  const [search, setSearch] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const [hoverUid, setHoverUid] = useState<string | null>(null);
  const [vb, setVb] = useState<ViewBox>(HOME);
  /** Rendered width of the SVG in CSS pixels; VIEW_W until measured. */
  const [renderedW, setRenderedW] = useState(VIEW_W);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    id: number;
    sx: number;
    sy: number;
    vb: ViewBox;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    d0: number;
    vb0: ViewBox;
    cx: number;
    cy: number;
  } | null>(null);

  /**
   * Two scales that used to be one. `zoom` is how far the viewBox is in
   * (1 = the whole country) and gates which detail appears. `k` is user
   * units per CSS pixel: multiply a pixel size by it and the pin, label
   * or scale bar keeps that size on screen at any container width. The
   * two agreed only while the map was a fixed 620px-ish wide, so giving
   * it the full page width scaled every marker up with it.
   */
  const zoom = vb.w / VIEW_W;
  const k = vb.w / renderedW;
  const zoomed = vb.w < VIEW_W - 0.5;

  /* Measure the rendered width so `k` is real pixels. Starts at VIEW_W,
     which is what the server renders with. */
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setRenderedW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    // The cadastre file is the map's largest network cost and nothing
    // above the fold needs it: the coarse district base renders first,
    // and the fine towns, land index and dissolved outlines swap in
    // when this arrives. Waiting for idle keeps it off the critical
    // path of the first paint.
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      fetch("/geo/lebanon-adm3.geojson")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((gj: { features: GeoFeature[] }) => {
        if (cancelled) return;
        const strip = computeBorderStripTowns(gj.features);
        const out: Town[] = gj.features.map((f, i) => {
          const name = String(f.properties.adm3_name ?? "");
          const district = String(f.properties.adm2_name ?? "");
          const c = featureCentroid(f);
          const a = featureAnchor(f);
          return {
            // Unique per polygon: 65 disputed areas share the name
            // "Litige", so name alone cannot identify a shape.
            uid: `${name}#${i}`,
            d: toSvgPath(f),
            name,
            district,
            zoneId: zoneForCodAdm1(String(f.properties.adm1_name ?? "")),
            occupied: OCCUPIED_COD_DISTRICTS_2026.includes(district),
            strip: strip.has(name),
            cx: c.x,
            cy: c.y,
            ax: a.room > 0 ? a.x : c.x,
            ay: a.room > 0 ? a.y : c.y,
            room: a.room,
          };
        });
        setTowns(out);
        // The land test uses the polygons the map draws, not the coarse
        // governorate outline, so a pin cannot sit just off a fine coast.
        setLandIndex(
          buildLandIndex(gj.features, 12, (lon, lat) => {
            const { x, y } = projectPoint(lon, lat);
            return [x, y];
          }),
        );

        // Boundaries dissolved from these same polygons, so outlines sit
        // exactly on the areas they enclose.
        /*
         * NOT isUnnamedArea here, and the difference is the whole point of
         * the distinction.
         *
         * `isUnnamedArea` answers "may I print this as a place name?" - and
         * for the 65 polygons called "Litige" the answer is no. But this
         * loop is not labelling anything: it dissolves polygon boundaries
         * into the district and governorate outlines, and those polygons
         * are real land in fifteen districts. Excluding them left the
         * outlines drawn from an incomplete set, with holes where disputed
         * areas sit. Geometry takes every polygon; only the labels are
         * choosy.
         *
         * "Conflict" alone stays excluded, as it was before: those slivers
         * are contested between districts, so dissolving them into one
         * would assert an attribution the boundary data does not make.
         */
        const groupBy = (key: (f: GeoFeature) => string) => {
          const m = new Map<string, GeoFeature[]>();
          for (const f of gj.features) {
            const n = String(f.properties.adm3_name ?? "");
            if (!n || n === "Conflict") continue;
            const g = key(f);
            if (!g) continue;
            if (!m.has(g)) m.set(g, []);
            m.get(g)!.push(f);
          }
          return m;
        };
        const districtGroups = groupBy((f) => String(f.properties.adm2_name ?? ""));
        const govGroups = groupBy((f) => String(f.properties.adm1_name ?? ""));
        setDistrictOutlines(
          [...districtGroups.entries()].map(([name, feats]) => ({
            name,
            d: dissolveBoundary(feats),
          })),
        );
        setGovOutlines([...govGroups.values()].map((feats) => dissolveBoundary(feats)));
        setStripOutline(
          dissolveBoundary(
            gj.features.filter((f) => strip.has(String(f.properties.adm3_name ?? ""))),
          ),
        );
      })
      .catch(() => {
        /* district base remains visible */
      });
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => void load(), { timeout: 4000 });
    } else {
      timerId = setTimeout(() => void load(), 250);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, []);

  /* Wheel zoom needs a non-passive native listener to preventDefault. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      setVb((cur) => {
        const cx = cur.x + ((e.clientX - rect.left) / rect.width) * cur.w;
        const cy = cur.y + ((e.clientY - rect.top) / rect.height) * cur.h;
        return zoomAt(cur, cx, cy, e.deltaY > 0 ? 1.22 : 1 / 1.22);
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    if (pointersRef.current.size === 2) {
      // Second finger down: switch from drag to pinch.
      const [p1, p2] = [...pointersRef.current.values()];
      const rect = e.currentTarget.getBoundingClientRect();
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      pinchRef.current = {
        d0: Math.max(1, Math.hypot(p1.x - p2.x, p1.y - p2.y)),
        vb0: vb,
        cx: vb.x + ((midX - rect.left) / rect.width) * vb.w,
        cy: vb.y + ((midY - rect.top) / rect.height) * vb.h,
      };
      dragRef.current = null;
      setDragging(false);
    } else {
      dragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, vb, moved: false };
    }
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const [p1, p2] = [...pointersRef.current.values()];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (dist > 1) {
        const nw = Math.min(Math.max(pinch.vb0.w * (pinch.d0 / dist), MIN_W), VIEW_W);
        const r = nw / pinch.vb0.w;
        setVb(
          clampVb(
            pinch.cx - (pinch.cx - pinch.vb0.x) * r,
            pinch.cy - (pinch.cy - pinch.vb0.y) * r,
            nw,
          ),
        );
      }
      return;
    }
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setVb(
      clampVb(
        d.vb.x - dx * (d.vb.w / rect.width),
        d.vb.y - dy * (d.vb.h / rect.height),
        d.vb.w,
      ),
    );
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pinchRef.current) {
      suppressClickRef.current = true;
      if (pointersRef.current.size < 2) pinchRef.current = null;
      return;
    }
    if (dragRef.current?.id !== e.pointerId) return;
    if (dragRef.current.moved) suppressClickRef.current = true;
    dragRef.current = null;
    setDragging(false);
  }

  function onDoubleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = vb.x + ((e.clientX - rect.left) / rect.width) * vb.w;
    const cy = vb.y + ((e.clientY - rect.top) / rect.height) * vb.h;
    setVb(zoomAt(vb, cx, cy, 1 / 1.8));
  }

  function onClickCapture(e: React.MouseEvent) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  }

  const townNames = useMemo(
    () =>
      towns
        ? [
            ...new Set(
              towns
                .filter((t) => t.name && !isUnnamedArea(t.name))
                .map((t) => `${t.name} (${t.district})`),
            ),
          ].sort()
        : [],
    [towns],
  );

  function selectTown(t: Town) {
    setSelectedZone(t.zoneId || null);
    setSelectedArea(tr.area(t.name, t.district));
    setSelectedDistrict(t.district);
    setSelectedTownRaw(t.name);
    setSelectedTownUid(t.uid);
    setSelectedOccupation(
      year !== 2026 ? "" : t.strip ? "strip" : t.occupied ? "district" : "",
    );
  }

  function onSearch(value: string) {
    setSearch(value);
    if (!towns) return;
    const m = value.match(/^(.*) \(([^)]+)\)$/);
    if (!m) return;
    const t = towns.find((x) => x.name === m[1] && x.district === m[2]);
    if (t) {
      selectTown(t);
      setVb(vbAround(t.cx, t.cy, VIEW_W / 5));
    }
  }

  const selectedTownName = selectedTownRaw;

  /** Place-name index over the loaded town layer. */
  const locIndex = useMemo(() => (towns ? buildLocationIndex(towns) : null), [towns]);

  /**
   * The tracking localized: entries matched to the districts and
   * towns their location names actually refer to. Derived from real
   * entry fields - regional phrases stay in the zone totals.
   */
  const { districtRecords, townRecords, maxDistrict, maxTown } = useMemo(() => {
    const byDistrict = new Map<string, SlimRecord[]>();
    const byTown = new Map<string, SlimRecord[]>();
    if (locIndex) {
      for (const r of records) {
        const m = matchLocations(locIndex, r.locationNames ?? []);
        for (const d of m.districts) {
          if (!byDistrict.has(d)) byDistrict.set(d, []);
          byDistrict.get(d)!.push(r);
        }
        for (const t of m.towns) {
          if (!byTown.has(t)) byTown.set(t, []);
          byTown.get(t)!.push(r);
        }
      }
    }
    return {
      districtRecords: byDistrict,
      townRecords: byTown,
      maxDistrict: Math.max(1, ...[...byDistrict.values()].map((v) => v.length)),
      maxTown: Math.max(1, ...[...byTown.values()].map((v) => v.length)),
    };
  }, [locIndex, records]);

  /** Per-district located-entry counts for both years (change view). */
  const change = useMemo(() => {
    const byDistrict = new Map<string, { y24: number; y26: number }>();
    if (locIndex) {
      for (const r of recordsAllYears) {
        const m = matchLocations(locIndex, r.locationNames ?? []);
        for (const d of m.districts) {
          const e = byDistrict.get(d) ?? { y24: 0, y26: 0 };
          if (r.year === 2024) e.y24++;
          else e.y26++;
          byDistrict.set(d, e);
        }
      }
    }
    const maxAbs = Math.max(
      1,
      ...[...byDistrict.values()].map((e) => Math.abs(e.y26 - e.y24)),
    );
    return { byDistrict, maxAbs };
  }, [locIndex, recordsAllYears]);

  /** The 2026 assessment's worst cadasters, resolved onto the town layer. */
  const damageAnchors = useMemo(() => {
    if (!towns || !locIndex) return [];
    const byName = new Map(towns.map((t) => [t.name, t] as const));
    const out: { town: Town; label: string; destroyed: number }[] = [];
    for (const zone of destruction.zones2026) {
      for (const c of zone.worstCadasters) {
        const m = matchLocations(locIndex, [c.name]);
        const townName = [...m.towns][0];
        const t = townName ? byName.get(townName) : undefined;
        if (t) out.push({ town: t, label: c.name, destroyed: c.destroyed });
      }
    }
    return out;
  }, [towns, locIndex]);
  const maxDestroyed = Math.max(1, ...damageAnchors.map((a) => a.destroyed));

  /**
   * The unified point layer: every town where something traced
   * happened - traced activities naming it or episodes - marked at the
   * town's actual location (polygon centroid), coloured by the leading
   * actor layer and sized by how much is traced there.
   */
  const placePoints = useMemo(() => {
    if (!towns) return [];
    const byName = new Map<string, Town>();
    for (const t of towns) if (!byName.has(t.name)) byName.set(t.name, t);
    const names = new Set<string>([...townRecords.keys()]);
    for (const t of towns) if (eventsByTown.has(t.name)) names.add(t.name);
    const out: {
      town: Town;
      records: SlimRecord[];
      episodes: MapEvent[];
      color: string;
      dominantLabel: string;
      total: number;
      /** Layer composition slices (entries + episodes), for donut markers. */
      mix: { color: string; count: number }[];
    }[] = [];
    for (const name of names) {
      const t = byName.get(name);
      if (!t || isUnnamedArea(name)) continue;
      const recs = townRecords.get(name) ?? [];
      const eps = eventsFor(eventsByTown.get(name), year);
      if (recs.length === 0 && eps.length === 0) continue;
      const counts: Record<string, number> = {};
      for (const r of recs) counts[r.actorLayer] = (counts[r.actorLayer] ?? 0) + 1;
      let contextCount = 0;
      for (const e of eps) {
        if (e.kind === "context") contextCount++;
        else counts[e.kind] = (counts[e.kind] ?? 0) + 1;
      }
      let dominant: (typeof LAYER_META)[number] | undefined;
      let best = 0;
      for (const l of LAYER_META) {
        const c = counts[l.id] ?? 0;
        if (c > best) {
          best = c;
          dominant = l;
        }
      }
      const mix = LAYER_META.map((l) => ({
        color: l.color,
        count: counts[l.id] ?? 0,
      })).filter((m) => m.count > 0);
      if (contextCount > 0) mix.push({ color: CHART.label, count: contextCount });
      out.push({
        town: t,
        records: recs,
        episodes: eps,
        color: dominant?.color ?? CHART.label,
        dominantLabel: dominant?.label ?? "Conflict context",
        total: recs.length + eps.length,
        mix,
      });
    }
    return out.sort((a, b) => b.total - a.total);
  }, [towns, townRecords, year]);

  /**
   * Every traced entry as its own pin, placed at the town the sources
   * name and fanned around its centroid so a forty-entry town is forty
   * reachable pins rather than one circle with a 40 printed on it.
   */
  const entryPinsRaw = useMemo(() => {
    if (!towns || !locIndex)
      return [] as (Pin & { town: Town; cx: number; cy: number; siblings: number })[];
    const byName = new Map<string, Town>();
    for (const t of towns) if (!byName.has(t.name)) byName.set(t.name, t);
    const district = new Map(towns.map((t) => [t.name, t.district] as const));
    // A unit fan: spacing 1, so every offset is a pure direction and
    // distance for the zoom-aware pass below to scale. fanOffset is linear
    // in its spacing, so scaling there is exactly equal to having laid the
    // fan out at that spacing here - and it keeps place-name matching, the
    // expensive half, off the zoom path.
    const grouped = buildPins({
      entries: records,
      index: locIndex,
      townDistrict: district,
      year,
      locale,
      spacing: 1,
    });
    const out: (Pin & { town: Town; cx: number; cy: number; siblings: number })[] = [];
    for (const [name, pins] of grouped) {
      const t = byName.get(name);
      if (!t) continue;
      for (const pin of pins)
        out.push({ ...pin, town: t, cx: t.ax, cy: t.ay, siblings: pins.length });
    }
    return out;
  }, [towns, locIndex, records, year, locale]);

  /**
   * Size each fan to its town, then pull any pin the spiral put in the sea
   * back onto land.
   *
   * PIN_SPACING is what a fan wants - nine screen pixels between
   * neighbours, so pins stay the same distance apart however far the
   * reader has zoomed in. The town's own room is what it gets. The smaller
   * of the two wins, because a fan reaching past the boundary draws
   * entries onto the neighbouring town and so says they happened there.
   *
   * Room is measured in map units and PIN_SPACING in screen pixels, so the
   * former is divided by k to meet the latter. The offsets are screen
   * pixels inside a scale(k) group, so they are converted to map units for
   * the land test and back afterwards. Kept apart from the memo above so
   * that zooming re-runs this and not the matching.
   */
  const entryPins = useMemo(
    () =>
      entryPinsRaw.map((pin) => {
        const spacing = fitSpacing(pin.siblings, pin.town.room / k, PIN_SPACING);
        const moved = clampToLand(pin.cx, pin.cy, pin.dx * spacing * k, pin.dy * spacing * k, (x, y) =>
          landIndex
            ? isOnLandIndexed(landIndex, x, y)
            : (() => {
                const { lon, lat } = unprojectPoint(x, y);
                return isOnLand(lon, lat);
              })(),
        );
        return { ...pin, dx: moved.dx / k, dy: moved.dy / k };
      }),
    [entryPinsRaw, k, landIndex],
  );

  /**
   * The ranked places behind the open view, built from the same values
   * the shading and the pins use, so the panel cannot contradict them.
   */
  const rankRows = useMemo((): RankRow[] => {
    if (view === "entries")
      return placePoints.map((p) => ({
        key: p.town.name,
        label: p.town.name,
        value: p.total,
      }));
    if (view === "change")
      return [...change.byDistrict.entries()].map(([district, e]) => ({
        key: district,
        label: district,
        value: e.y26 - e.y24,
        signed: true,
      }));
    if (view === "survey")
      return districtDamage.districts.map((d) => ({
        key: d.codName,
        label: d.name,
        value: d.units,
        display: `${d.units.toLocaleString("en-US")}`,
        note: d.completeShare ? tr.completeShare(d.completeShare) : undefined,
      }));
    return damageAnchors.map((a) => ({
      key: a.label,
      label: a.label,
      value: a.destroyed,
    }));
  }, [view, placePoints, change, damageAnchors, tr]);

  /** Top points labelled even at national zoom (skipping city labels). */
  const topPlaceNames = useMemo(() => {
    const cityPoints = CITY_LABELS.map((c) => projectPoint(c.lon, c.lat));
    return new Set(
      placePoints
        .filter(
          (p) =>
            !cityPoints.some(
              (c) => Math.hypot(c.x - p.town.cx, c.y - p.town.cy) < 14,
            ),
        )
        .slice(0, 6)
        .map((p) => p.town.name),
    );
  }, [placePoints]);

  /**
   * Zoomed label set: greedy collision avoidance, highest traced
   * volume first, so the dense south cluster stays readable.
   */
  const declutteredLabels = useMemo(() => {
    const accepted: { x: number; y: number }[] = [];
    const set = new Set<string>();
    const minDist = 22 * k;
    for (const p of placePoints) {
      if (
        accepted.some((a) => Math.hypot(a.x - p.town.cx, a.y - p.town.cy) < minDist)
      )
        continue;
      accepted.push({ x: p.town.cx, y: p.town.cy });
      set.add(p.town.name);
    }
    return set;
  }, [placePoints, k]);

  /** Town fills - memoized so zoom/pan and hover don't re-diff 1,600 paths. */
  const townLayer = useMemo(() => {
    if (!towns) return null;
    return towns.map((t) => {
      const dCount = districtRecords.get(t.district)?.length ?? 0;
      const namedCount = townRecords.get(t.name)?.length ?? 0;
      const unnamed = isUnnamedArea(t.name) || !t.zoneId;
      const isSel = selectedTownUid === t.uid;
      // Areas outside the assessed war zones are carried as context.
      const affected = AFFECTED_ZONE_IDS.includes(t.zoneId);
      const onStrip2026 = year === 2026 && t.strip;
      const occupied2026 = year === 2026 && t.occupied;

      let fill = unnamed ? "#B9C2CE" : rampColor;
      let opacity: number;
      let hoverText: string;
      if (view === "change" && !unnamed) {
        const e = change.byDistrict.get(t.district) ?? { y24: 0, y26: 0 };
        const delta = e.y26 - e.y24;
        fill = delta >= 0 ? VALENCE.good : VALENCE.bad;
        opacity = 0.06 + (Math.abs(delta) / change.maxAbs) * 0.72;
        hoverText = tr.hoverChange(t.name, t.district, e.y24, e.y26);
      } else if (view === "survey" && !unnamed) {
        const s = SURVEY_BY_DISTRICT.get(t.district);
        fill = UI.rust;
        opacity = s ? 0.12 + (s.units / SURVEY_MAX) * 0.75 : 0.05;
        hoverText = s
          ? tr.hoverSurvey(t.name, t.district, s.units.toLocaleString("en-US"), s.completeShare ?? undefined)
          : tr.hoverSurveyNone(t.name, t.district);
      } else if (view === "damage" && !unnamed) {
        opacity = 0.1;
        hoverText = tr.hoverDamage(t.name, t.district);
      } else {
        // Entries view: the base map is geography and nothing else. The
        // quantity lives in the pins now, one per entry, so tinting the
        // land by the same quantity said it twice and put a colour ramp
        // in direct competition with the actor-layer colours the pins
        // carry. Grey keeps colour meaning exactly one thing.
        fill = unnamed ? "#B9C2CE" : "#E1E7EE";
        opacity = unnamed ? 0.35 : 0.9;
        hoverText = tr.hoverEntries(t.name, t.district, dCount, namedCount);
      }
      if (!affected && !unnamed) opacity *= 0.42;
      if (!unnamed && onStrip2026) hoverText += tr.stripSuffix;
      else if (!unnamed && occupied2026) hoverText += tr.occupiedSuffix;

      return (
        <path
          key={t.uid}
          d={t.d}
          fill={fill}
          fillOpacity={opacity}
          stroke={isSel ? "#173B63" : view === "entries" ? "#AEBBCA" : "#FFFFFF"}
          strokeWidth={isSel ? 1.8 : view === "entries" ? 0.4 : 0.3}
          strokeOpacity={isSel ? 1 : affected ? 0.8 : 0.45}
          vectorEffect="non-scaling-stroke"
          className={unnamed ? undefined : "cursor-pointer"}
          onClick={unnamed ? undefined : () => selectTown(t)}
          onPointerEnter={
            unnamed
              ? undefined
              : () => {
                  setHover(hoverText);
                  setHoverUid(t.uid);
                }
          }
          onPointerLeave={
            unnamed
              ? undefined
              : () => {
                  setHover(null);
                  setHoverUid(null);
                }
          }
        >
          <title>
            {unnamed ? tr.unnamed : hoverText}
          </title>
        </path>
      );
    });
    // selectTown is recreated per render but only closes over `year` (a dep).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [towns, regionValues, maxRegion, rampColor, selectedTownUid, year, view, change, districtRecords, townRecords, maxDistrict, maxTown, locale]);

  const zoneMentions = selectedZone
    ? (locations.mentions[String(year) as "2024" | "2026"][
        selectedZone as keyof (typeof locations.mentions)["2024"]
      ] as Record<ActorLayer, number> | undefined)
    : undefined;

  const selectedDistrictRecords = selectedDistrict
    ? districtRecords.get(selectedDistrict) ?? []
    : [];
  const selectedTownRecords = selectedTownRaw
    ? townRecords.get(selectedTownRaw) ?? []
    : [];
  const showOccupation = view === "change" || year === 2026;
  const townEvents = eventsFor(
    selectedTownRaw ? eventsByTown.get(selectedTownRaw) : undefined,
    year,
  );
  /** Adaptive scale bar: a round distance that stays 40–150 px on screen. */
  const scaleKm =
    [100, 50, 25, 10, 5, 2, 1].find((km) => (km * PX_PER_KM) / k <= 150) ?? 1;
  const scaleLen = scaleKm * PX_PER_KM;

  return (
    <div>
      {note ? (
        <p className="mb-2 rounded-md border border-border bg-white px-3 py-2 text-xs text-text-secondary">
          {note}
        </p>
      ) : null}

      {/* Town search */}
      <div className="mb-3">
        <label htmlFor="town-search" className="block text-[11px] font-semibold text-text-secondary">
          {tr.findTown(towns ? townNames.length.toLocaleString("en-US") : tr.loading)}
        </label>
        <input
          id="town-search"
          type="search"
          list="town-list"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={tr.searchPlaceholder}
          disabled={!towns}
          className="mt-1 min-h-11 w-full max-w-md rounded-md border border-border bg-white px-2.5 text-sm"
        />
        <datalist id="town-list">
          {townNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>

      {/* The view switcher, the zoom buttons and the region shortcuts are
          gone; the map opens on the whole country and is zoomed by wheel,
          drag, pinch or double-click, with the overview button in the
          corner to recentre. The zoom factor still reads out, because it
          is the one thing those gestures do not tell you. */}
      <p className="mb-2 text-end text-xs tabular-nums text-text-secondary">
        {tr.zoomReadout((VIEW_W / vb.w).toFixed(1))}
      </p>

      {/* Lebanon's outline is portrait, so a full-width map would run
          about 1,700px tall. The map is capped by height instead, its
          column sized to that cap so no gutter is left over, and the space
          beside it carries the key and - once something is picked - the
          detail panel. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,min(82vh,46rem))_minmax(0,1fr)] lg:items-start">
        <div>
          {/* The drawing itself stays left-to-right in both languages, so
              geometry, labels and the scale bar never mirror. */}
          <div dir="ltr" className="relative mx-auto w-full max-w-[min(82vh,46rem)] select-none overflow-hidden rounded-lg border-2 border-[#c9d4e0] bg-[#E9EDF2] shadow-[0_2px_16px_rgba(23,59,99,0.10)]">
            <svg
              ref={svgRef}
              viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
              role="group"
              aria-label={tr.mapAria(year, showOccupation)}
              className={`block h-auto w-full ${dragging ? "cursor-grabbing" : ""}`}
              style={{ touchAction: zoomed ? "none" : "pan-y" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onDoubleClick={onDoubleClick}
              onClickCapture={onClickCapture}
            >
              <defs>
                <pattern
                  id="occupied-hatch"
                  width="7"
                  height="7"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="7" height="7" fill="transparent" />
                  <line x1="0" y1="0" x2="0" y2="7" stroke={UI.rust} strokeWidth="2.2" strokeOpacity="0.55" />
                </pattern>
              </defs>

              {townLayer ?? (
                /* Instant server-rendered district base while towns load */
                DISTRICT_PATHS.map((p) => {
                  const v = regionValues[p.zoneId] ?? 0;
                  // Districts outside the zones the war reached are drawn
                  // as land and named, and that is all: a "0 mentions"
                  // tooltip on a northern district invites the reader to
                  // read absence of tracing as absence of activity, when
                  // there was nothing there to trace.
                  const traced = AFFECTED_ZONE_IDS.includes(p.zoneId);
                  return (
                    <path
                      key={p.name}
                      d={p.d}
                      fill="#E1E7EE"
                      fillOpacity={0.9}
                      stroke="#FFFFFF"
                      strokeWidth={0.6}
                      strokeOpacity={0.85}
                    >
                      <title>
                        {traced
                          ? tr.baseTitle(p.name, regionLabel(p.zoneId, locale) || p.zoneLabel, v, year)
                          : p.name}
                      </title>
                    </path>
                  );
                })
              )}

              {/* District (qada) outlines, dissolved from the same town
                  polygons the map fills, so borders sit on the areas */}
              {towns
                ? districtOutlines.map((p) => (
                    <path
                      key={`dist-${p.name}`}
                      d={p.d}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      strokeOpacity={0.9}
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  ))
                : DISTRICT_PATHS.map((p) => (
                    <path
                      key={`dist-base-${p.name}`}
                      d={p.d}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      strokeOpacity={0.9}
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  ))}

              {/* Occupation (2026): hatch only the Blue Line border-strip
                  towns, with one dissolved outline around the strip. */}
              {showOccupation && towns
                ? towns
                    .filter((t) => t.strip)
                    .map((t) => (
                      <path
                        key={`occ-${t.uid}`}
                        d={t.d}
                        fill="url(#occupied-hatch)"
                        stroke="none"
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                      />
                    ))
                : null}
              {showOccupation && stripOutline ? (
                <path
                  d={stripOutline}
                  fill="none"
                  stroke={UI.rust}
                  strokeWidth={1.4}
                  strokeOpacity={0.85}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              ) : null}

              {/* Governorate outlines, dissolved from the town layer */}
              {towns && govOutlines.length > 0
                ? govOutlines.map((d, i) => (
                    <path
                      key={`gov-${i}`}
                      d={d}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={1.8}
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  ))
                : GOV_PATHS.map((p) => (
                    <path
                      key={`gov-base-${p.name}`}
                      d={p.d}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={1.8}
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  ))}

              {/* The Litani - the boundary the "South of the Litani"
                  assessment zone and LEAP's scope refer to */}
              {LITANI_PATHS.map((d, i) => (
                <path
                  key={`litani-${i}`}
                  d={d}
                  fill="none"
                  stroke="#4E88B0"
                  strokeWidth={1.5}
                  strokeOpacity={0.85}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              ))}
              {(() => {
                const anchor = projectPoint(35.44, 33.365);
                return (
                  <text
                    x={anchor.x}
                    y={anchor.y - 4 * k}
                    fontSize={9.5 * k}
                    fontStyle="italic"
                    fill="#3E6E90"
                    stroke="#FFFFFF"
                    strokeWidth={2.2 * k}
                    paintOrder="stroke"
                    fontWeight={600}
                    pointerEvents="none"
                    aria-hidden
                  >
                    Litani
                  </text>
                );
              })()}

              {/* Hovered town outline - keyed by unique polygon id, so only
                  the shape under the cursor highlights */}
              {(() => {
                const t = towns?.find((x) => x.uid === hoverUid);
                return t ? (
                  <path
                    d={t.d}
                    fill="none"
                    stroke={CHART.text}
                    strokeWidth={1.6}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                ) : null;
              })()}

              {/* District labels appear once zoomed in */}
              {zoom <= 0.55
                ? DISTRICT_LABELS.map((l) => (
                    <text
                      key={`dl-${l.name}`}
                      x={l.x}
                      y={l.y}
                      fontSize={9.5 * k}
                      textAnchor="middle"
                      fill="#54657A"
                      stroke="#FFFFFF"
                      strokeWidth={2.2 * k}
                      paintOrder="stroke"
                      fontWeight={600}
                      letterSpacing={0.4 * k}
                      style={{ textTransform: "uppercase" }}
                      pointerEvents="none"
                      aria-hidden
                    >
                      {l.name}
                    </text>
                  ))
                : null}

              {/* Major-city reference labels */}
              {CITY_LABELS.map((c) => {
                const { x, y } = projectPoint(c.lon, c.lat);
                return (
                  <g
                    key={c.name}
                    transform={`translate(${x} ${y}) scale(${k})`}
                    pointerEvents="none"
                    aria-hidden
                  >
                    <circle cx={0} cy={0} r={2} fill="#4A5A6B" />
                    <text
                      x={4.5}
                      y={-3.5}
                      fontSize={10.5}
                      fill="#3D4C5C"
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      paintOrder="stroke"
                      fontWeight={600}
                    >
                      {c.name}
                    </text>
                  </g>
                );
              })}

              {/* One pin per traced entry, fanned around the town the
                  sources name. Colour = that entry's own actor layer. */}
              {view === "entries"
                ? entryPins.map((pin) => {
                    const isSel = selectedTownName === pin.townName;
                    const rp = PIN_R * (isSel ? 1.4 : 1);
                    const edge = isSel ? "#173B63" : pinOutline(pin.color);
                    const label = `${pin.title} - ${pin.townName}${pin.district ? `, ${pin.district}` : ""} · ${pin.detail}`;
                    return (
                      <g
                        key={pin.id}
                        transform={`translate(${pin.cx} ${pin.cy}) scale(${k}) translate(${pin.dx} ${pin.dy})`}
                        tabIndex={0}
                        role="button"
                        aria-label={label}
                        className="group/pin cursor-pointer focus-visible:outline-2 focus-visible:outline-blue"
                        onClick={() => {
                          setOpenPin(pin);
                          selectTown(pin.town);
                        }}
                        onPointerEnter={() => {
                          setHover(label);
                          setHoverUid(pin.townName);
                        }}
                        onPointerLeave={() => {
                          setHover(null);
                          setHoverUid(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenPin(pin);
                            selectTown(pin.town);
                          }
                        }}
                      >
                        {/* The target, invisible and wider than the dot. */}
                        <circle r={PIN_HIT} fill="transparent" />
                        {/* An episode is a ring, an entry a solid dot -
                            distinguishable without relying on colour. The
                            dot grows under the pointer and on keyboard
                            focus, so the target being hit is never in
                            doubt. */}
                        <circle
                          r={rp}
                          fill={pin.kind === "episode" ? "#FFFFFF" : pin.color}
                          stroke={pin.kind === "episode" ? pin.color : edge}
                          strokeWidth={pin.kind === "episode" ? PIN_STROKE * 2 : PIN_STROKE}
                          className="pointer-events-none transition-transform duration-100 group-hover/pin:scale-150 group-focus-visible/pin:scale-150"
                          style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        />
                        <title>{label}</title>
                      </g>
                    );
                  })
                : null}

              {/* Town names sit over their fan, not on any one pin. */}
              {view === "entries"
                ? placePoints.map((p) => {
                    const t = p.town;
                    const showLabel =
                      zoom <= 0.5
                        ? declutteredLabels.has(t.name)
                        : topPlaceNames.has(t.name);
                    if (!showLabel) return null;
                    // The label clears the fan, so it has to be measured
                    // against the same fitted spacing the pins were laid
                    // out with, from the same anchor.
                    const reach = fanRadius(
                      p.total,
                      fitSpacing(p.total, t.room / k, PIN_SPACING),
                    );
                    return (
                      <text
                        key={`pl-${t.name}`}
                        transform={`translate(${t.ax} ${t.ay}) scale(${k})`}
                        x={reach + 5}
                        y={3}
                        fontSize={9.5}
                        fill={CHART.text}
                        stroke="#FFFFFF"
                        strokeWidth={2.2}
                        paintOrder="stroke"
                        fontWeight={600}
                        pointerEvents="none"
                      >
                        {t.name}
                        <tspan
                          dx={3}
                          fontSize={8.5}
                          fontWeight={700}
                          fill={CHART.label}
                        >
                          {p.total}
                        </tspan>
                      </text>
                    );
                  })
                : null}

              {/* Damage-assessment badges: worst cadasters + the Dahieh debris share */}
              {view === "damage" ? (
                <>
                  {damageAnchors.map((a) => {
                    const r = 6.5 + Math.sqrt(a.destroyed / maxDestroyed) * 10;
                    return (
                      <g
                        key={`dmg-${a.town.name}`}
                        transform={`translate(${a.town.cx} ${a.town.cy}) scale(${k})`}
                        className="cursor-pointer"
                        onClick={() => selectTown(a.town)}
                        tabIndex={0}
                        role="button"
                        aria-label={tr.dmgAria(a.label, a.destroyed.toLocaleString("en-US"))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectTown(a.town);
                          }
                        }}
                      >
                        <circle r={r} fill={UI.rust} fillOpacity={0.75} stroke="#FFFFFF" strokeWidth={1.4} />
                        <text
                          y={3.2}
                          fontSize={8.5}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontWeight={700}
                        >
                          {a.destroyed.toLocaleString("en-US")}
                        </text>
                        <text
                          y={r + 9}
                          fontSize={9.5}
                          textAnchor="middle"
                          fill="#7A3327"
                          stroke="#FFFFFF"
                          strokeWidth={2.2}
                          paintOrder="stroke"
                          fontWeight={600}
                        >
                          {a.label}
                        </text>
                        <title>{tr.dmgTitle(a.label, a.destroyed.toLocaleString("en-US"))}</title>
                      </g>
                    );
                  })}
                  {(() => {
                    const baabda = DISTRICT_LABELS.find((l) => l.name === "Baabda");
                    if (!baabda) return null;
                    return (
                      <g
                        transform={`translate(${baabda.x} ${baabda.y}) scale(${k})`}
                        pointerEvents="none"
                        aria-hidden
                      >
                        <circle r={9} fill={UI.rust} fillOpacity={0.55} stroke="#FFFFFF" strokeWidth={1.4} />
                        <text
                          y={16}
                          fontSize={9.5}
                          textAnchor="middle"
                          fill="#7A3327"
                          stroke="#FFFFFF"
                          strokeWidth={2.2}
                          paintOrder="stroke"
                          fontWeight={600}
                        >
                          {tr.dahieh}
                        </text>
                      </g>
                    );
                  })()}
                </>
              ) : null}

              {/* Scale bar */}
              <g
                transform={`translate(${vb.x + 10 * k} ${vb.y + vb.h - 12 * k})`}
                pointerEvents="none"
                aria-hidden
              >
                <rect
                  x={-4 * k}
                  y={-9 * k}
                  width={scaleLen + 42 * k}
                  height={14 * k}
                  rx={2 * k}
                  fill="#FFFFFF"
                  fillOpacity={0.8}
                />
                <rect x={0} y={-2.5 * k} width={scaleLen} height={2.5 * k} fill="#3D4C5C" />
                <rect x={0} y={-2.5 * k} width={scaleLen / 2} height={2.5 * k} fill="#8595A6" />
                <text x={scaleLen + 4 * k} y={0} fontSize={9 * k} fill="#3D4C5C">
                  {scaleKm} {tr.km}
                </text>
              </g>
            </svg>
            {hover ? (
              <div className="pointer-events-none absolute left-2 top-2 max-w-[75%] rounded-sm bg-white/95 px-2 py-1 text-[11px] font-medium text-text shadow-sm">
                {hover}
              </div>
            ) : null}
            {zoomed ? (
              <button
                type="button"
                aria-label={tr.overviewAria}
                className="absolute right-2 top-2 rounded-sm border border-border bg-white/90 p-0.5 shadow-sm"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const cx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
                  const cy = ((e.clientY - rect.top) / rect.height) * VIEW_H;
                  setVb((cur) => vbAround(cx, cy, cur.w));
                }}
              >
                <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={56} height={78} aria-hidden>
                  {GOV_PATHS.map((p) => (
                    <path key={`mini-${p.name}`} d={p.d} fill="#D7DEE6" stroke="#FFFFFF" strokeWidth={4} />
                  ))}
                  <rect
                    x={vb.x}
                    y={vb.y}
                    width={vb.w}
                    height={vb.h}
                    fill="#173B63"
                    fillOpacity={0.15}
                    stroke="#173B63"
                    strokeWidth={10}
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
        {/* The opened pin, above everything else: it is what the reader
            just asked for, and one pin is one traced entry. */}
        {openPin ? (
          <aside
            aria-live="polite"
            className="card border-s-4"
            style={{ borderInlineStartColor: openPin.color }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  {openPin.kind === "episode" ? tr.episodeAt : tr.entryAt}{" "}
                  {openPin.townName}
                  {openPin.district ? ` · ${openPin.district}` : ""} · {openPin.year}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-navy">
                  {openPin.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenPin(null)}
                aria-label={tr.close}
                className="shrink-0 rounded-sm px-1.5 text-text-secondary hover:text-navy"
              >
                ×
              </button>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide">
              <span
                className="rounded-sm px-1.5 py-0.5 text-white"
                style={{ background: openPin.color }}
              >
                {openPin.layerLabel}
              </span>
              {openPin.subtype ? (
                <span className="rounded-sm bg-[#F2F2EF] px-1.5 py-0.5 text-text-secondary">
                  {openPin.subtype}
                </span>
              ) : null}
              {openPin.date ? (
                <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 tabular-nums text-navy">
                  {fmtDate(openPin.date, locale)}
                </span>
              ) : null}
            </p>
            {openPin.kind === "entry" ? (
              <p className="mt-2 text-[11.5px] text-text-secondary">
                {openPin.detail}
              </p>
            ) : null}
            <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-text">
              {openPin.body}
            </p>
            <p className="mt-2.5 border-t border-dashed border-border pt-2 text-[11px] leading-relaxed text-text-secondary">
              {tr.pinNote}
            </p>
          </aside>
        ) : null}
        {/* The key sits beside the map, never over it - covering the
            south-west corner is covering the most densely traced part. */}
        {view === "entries" ? (
          <MapLegend locale={locale} />
        ) : null}
        {/* Every view, not just the pinned one, gets its places named
            and ordered rather than only shaded. */}
        <ViewRanking view={view} rows={rankRows} locale={locale} />
        {/* Detail panel: rendered only once a town or zone is picked,
            so nothing empty sits under the map. */}
        {selectedZone && zoneMentions ? (
          <aside aria-live="polite" className="card">
            <>
              <h3 className="text-sm font-semibold text-navy">
                {selectedArea ? `${selectedArea} · ` : ""}
                {regionLabel(selectedZone, locale)} · {year}
              </h3>
              {selectedOccupation === "strip" ? (
                <p className="mt-1.5 rounded-sm bg-[#F7E9E5] px-2 py-1 text-xs font-medium text-rust">
                  {locale === "ar" ? (
                    <>
                      على شريط الخط الأزرق الحدودي، حيث يُظهر الإبلاغ قرى
                      محتلة والمنطقة التي رُسمت حدودها في 18 حزيران 2026؛
                      وأهالي القرى المحتلة لا يستطيعون العودة.
                    </>
                  ) : (
                    <>
                      On the Blue Line border strip, where the reporting shows
                      occupied villages and the zone demarcated on 18 June 2026;
                      residents of occupied villages cannot return.
                    </>
                  )}
                </p>
              ) : selectedOccupation === "district" ? (
                <p className="mt-1.5 rounded-sm bg-[#FBF3EC] px-2 py-1 text-xs text-rust">
                  {locale === "ar" ? (
                    <>
                      في قضاء يضم شريطه الحدودي مناطق محتلة إسرائيلياً
                      (2026)؛ هذه البلدة نفسها ليست على الشريط.
                    </>
                  ) : (
                    <>
                      In a district whose border strip contains Israeli-occupied
                      areas (2026); this town itself is not on the strip.
                    </>
                  )}
                </p>
              ) : null}
              {(() => {
                const anchor = damageAnchors.find((a) => a.town.name === selectedTownRaw);
                return anchor ? (
                  <p className="mt-2 rounded-sm bg-[#F7E9E5] px-2.5 py-2 text-xs leading-relaxed">
                    {locale === "ar" ? (
                      <>
                        <strong className="text-rust">
                          {anchor.destroyed.toLocaleString("en-US")} مبنى مدمَّراً
                          كلياً
                        </strong>{" "}
                        هنا في تقييم جنوب الليطاني بتاريخ 29 نيسان 2026 (ذكاء
                        اصطناعي جغرافي مقابل خط أساس تشرين الأول 2025، بتدقيق
                        مكتبي ومن دون تثبيت ميداني) - من بين أسوأ أربعة عقارات
                        على مستوى البلاد.
                      </>
                    ) : (
                      <>
                        <strong className="text-rust">
                          {anchor.destroyed.toLocaleString("en-US")} buildings completely
                          destroyed
                        </strong>{" "}
                        here in the 29 April 2026 South-of-the-Litani assessment (GeoAI
                        against an October 2025 baseline, desk-validated, no field
                        confirmation) - among the four worst cadasters nationally.
                      </>
                    )}
                  </p>
                ) : null;
              })()}
              {(() => {
                const s = selectedDistrict
                  ? SURVEY_BY_DISTRICT.get(selectedDistrict)
                  : undefined;
                return s ? (
                  <p className="mt-2 rounded-sm bg-[#F7E9E5] px-2.5 py-2 text-xs leading-relaxed">
                    {locale === "ar" ? (
                      <>
                        <strong className="text-rust">
                          {s.units.toLocaleString("en-US")} وحدة سكنية
                        </strong>{" "}
                        أُبلغ عن تضرّرها في {s.name} في مسح البلديات في كانون
                        الأول 2024
                        {s.completeShare ? `، منها ${s.completeShare}% متضرّرة كلياً` : ""}
                        . تصريح بلدي جُمع في عشرة أيام، لا تقييم هندسي.
                      </>
                    ) : (
                      <>
                        <strong className="text-rust">
                          {s.units.toLocaleString("en-US")} housing units
                        </strong>{" "}
                        reported damaged in {s.name} in the December 2024 municipal
                        survey
                        {s.completeShare ? `, ${s.completeShare}% of them completely damaged` : ""}
                        . Municipal declaration collected in ten days, not an
                        engineering assessment.
                      </>
                    )}
                  </p>
                ) : null;
              })()}
              {view === "change" && selectedDistrict ? (
                <p className="mt-2 rounded-sm bg-[#F4F6F9] px-2.5 py-2 text-xs leading-relaxed">
                  {locale === "ar" ? (
                    <>
                      المدخلات المحدَّدة الموقع في قضاء {selectedDistrict}: من{" "}
                      <strong className="text-navy">
                        {(change.byDistrict.get(selectedDistrict)?.y24 ?? 0).toLocaleString("en-US")}
                      </strong>{" "}
                      في 2024 إلى{" "}
                      <strong className="text-navy">
                        {(change.byDistrict.get(selectedDistrict)?.y26 ?? 0).toLocaleString("en-US")}
                      </strong>{" "}
                      في 2026 ضمن الترشيح الحالي.
                    </>
                  ) : (
                    <>
                      Located entries in {selectedDistrict} district:{" "}
                      <strong className="text-navy">
                        {(change.byDistrict.get(selectedDistrict)?.y24 ?? 0).toLocaleString("en-US")}
                      </strong>{" "}
                      in 2024 →{" "}
                      <strong className="text-navy">
                        {(change.byDistrict.get(selectedDistrict)?.y26 ?? 0).toLocaleString("en-US")}
                      </strong>{" "}
                      in 2026 under the current filters.
                    </>
                  )}
                </p>
              ) : null}
              {selectedDistrict ? (
                <div className="mt-2 rounded-sm bg-[#F4F6F9] px-2.5 py-2 text-xs leading-relaxed">
                  <p>
                    {locale === "ar" ? (
                      <>
                        <span className="font-semibold text-navy">
                          {selectedDistrictRecords.length}
                        </span>{" "}
                        نشاطاً مرصوداً يحدد موقع عمل في قضاء {selectedDistrict}{" "}
                        ضمن الترشيح الحالي
                        {selectedTownRecords.length > 0 ? (
                          <>
                            {" "}-{" "}
                            <span className="font-semibold text-navy">
                              {selectedTownRecords.length}
                            </span>{" "}
                            منها يسمّي {selectedTownName} مباشرة
                          </>
                        ) : null}
                        .
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-navy">
                          {selectedDistrictRecords.length}
                        </span>{" "}
                        traced activity{selectedDistrictRecords.length === 1 ? "" : "s"} locate
                        work in {selectedDistrict} district under the current filters
                        {selectedTownRecords.length > 0 ? (
                          <>
                            {" "}-{" "}
                            <span className="font-semibold text-navy">
                              {selectedTownRecords.length}
                            </span>{" "}
                            name{selectedTownRecords.length === 1 ? "s" : ""} {selectedTownName}{" "}
                            directly
                          </>
                        ) : null}
                        .
                      </>
                    )}
                  </p>
                  {(() => {
                    const recs =
                      selectedTownRecords.length > 0
                        ? selectedTownRecords
                        : selectedDistrictRecords;
                    if (recs.length === 0) return null;
                    return (
                      <>
                        <div className="mt-2 space-y-1">
                          {layers(locale).map((l) => {
                            const c = recs.filter((r) => r.actorLayer === l.id).length;
                            if (c === 0) return null;
                            return (
                              <div key={l.id} className="flex items-center gap-1.5">
                                <span
                                  aria-hidden
                                  className="h-2 w-2 shrink-0 rounded-sm"
                                  style={{ background: l.color }}
                                />
                                <span className="w-32 shrink-0 truncate">{l.label}</span>
                                <span
                                  aria-hidden
                                  className="h-2 rounded-sm"
                                  style={{
                                    width: `${Math.max(4, (c / recs.length) * 55)}%`,
                                    background: l.color,
                                    opacity: 0.7,
                                  }}
                                />
                                <span className="tabular-nums font-semibold">{c}</span>
                              </div>
                            );
                          })}
                        </div>
                        {(() => {
                          const stageCounts = Array.from({ length: 12 }, (_, i) =>
                            recs.filter((r) => r.stageNo === i + 1).length,
                          );
                          const maxStage = Math.max(1, ...stageCounts);
                          return (
                            <div className="mt-2.5">
                              <div className="flex items-end gap-[2px]" aria-hidden>
                                {stageCounts.map((c, i) => (
                                  <div
                                    key={i}
                                    title={tr.stageTip(i + 1, stageList(locale)[i], c)}
                                    className="w-3.5 rounded-t-[2px]"
                                    style={{
                                      height: `${4 + (c / maxStage) * 26}px`,
                                      background: c > 0 ? "#58779B" : "#E3E9EF",
                                    }}
                                  />
                                ))}
                              </div>
                              <p className="mt-0.5 text-[10px] text-text-secondary">
                                {tr.stagesCaption(stageCounts.filter((c) => c > 0).length)}
                              </p>
                              <p className="sr-only">
                                {stageCounts
                                  .map((c, i) => `${stageList(locale)[i]}: ${c}`)
                                  .join("; ")}
                              </p>
                            </div>
                          );
                        })()}
                        <ul className="mt-1.5 space-y-0.5">
                          {[...new Set(recs.map((r) => r.actorName.split(":")[0]))]
                            .slice(0, 6)
                            .map((a) => (
                              <li key={a}>• {a}</li>
                            ))}
                        </ul>
                      </>
                    );
                  })()}
                </div>
              ) : null}
              <p className="mt-1 text-xs text-text-secondary">
                {tr.zoneScaleNote}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {layers(locale).map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                      {l.label}
                    </span>
                    <span className="tabular-nums font-semibold">{zoneMentions[l.id]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-text-secondary">
                {tr.mentionsCaution}
              </p>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <Link
                  href={locale === "ar" ? "/ar/actors" : "/actors#actor-register"}
                  className="font-medium text-blue underline-offset-2 hover:underline"
                >
                  {tr.whoLink}
                </Link>
                <Link
                  href={locale === "ar" ? "/ar/explorer" : "/explorer"}
                  className="font-medium text-blue underline-offset-2 hover:underline"
                >
                  {tr.explorerLink}
                </Link>
              </p>
              <EventsList events={townEvents} locale={locale} />
            </>
          </aside>
        ) : null}

          {/* Map legend */}
          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-text-secondary">
            {/* Colour meaning lives in the key; this row carries the count. */}
            {view === "entries" ? (
              <li>{tr.pinCount(entryPins.length, placePoints.length)}</li>
            ) : view === "change" ? (
              <>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-4" style={{ background: VALENCE.good, opacity: 0.7 }} />
                  {tr.changeMorePins}
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-4" style={{ background: VALENCE.bad, opacity: 0.7 }} />
                  {tr.changeFewerPins(change.maxAbs)}
                </li>
              </>
            ) : view === "survey" ? (
              <li className="flex items-center gap-1.5">
                <span className="flex items-center gap-0.5" aria-hidden>
                  {[0.15, 0.4, 0.65, 0.9].map((o) => (
                    <span key={o} className="h-2.5 w-4" style={{ background: UI.rust, opacity: o }} />
                  ))}
                </span>
                {tr.surveyLegend(SURVEY_MAX.toLocaleString("en-US"))}
              </li>
            ) : (
              <li className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ background: UI.rust }}
                >
                  n
                </span>
                {tr.damageLegend}
              </li>
            )}
            {showOccupation ? (
              <>
                <li className="flex items-center gap-1.5">
                  <svg width="16" height="12" aria-hidden>
                    <rect width="16" height="12" fill="url(#occupied-hatch)" stroke={UI.rust} strokeOpacity="0.7" />
                  </svg>
                  {tr.stripLegend}
                </li>
                <li className="flex items-center gap-1.5">
                  <svg width="16" height="12" aria-hidden>
                    <rect
                      x="1"
                      y="1"
                      width="14"
                      height="10"
                      fill="none"
                      stroke={UI.rust}
                      strokeOpacity="0.65"
                      strokeDasharray="3 2"
                    />
                  </svg>
                  {tr.stripDistrictsLegend}
                </li>
              </>
            ) : null}
          </ul>
          {view === "survey" ? (
            <p className="mt-1.5 rounded-md border border-border bg-white px-3 py-2 text-[11px] leading-relaxed text-text-secondary">
              {locale === "ar" ? (
                <>
                  تصريح بلدي، لا تقييم هندسي:{" "}
                  {districtDamage.totals.areasSurveyed} منطقة متضررة في{" "}
                  {districtDamage.totals.districtsCovered} قضاءً و
                  {districtDamage.totals.governoratesCovered} محافظات، 5-15
                  كانون الأول 2024، بإبلاغ عن{" "}
                  {districtDamage.totals.housingUnits.toLocaleString("en-US")}{" "}
                  وحدة سكنية متضررة ({districtDamage.totals.completelyDamagedShare}%
                  منها متضررة كلياً) ضمن{" "}
                  {districtDamage.totals.reportedAssets.toLocaleString("en-US")}{" "}
                  أصلاً مبلَّغاً عنه. الأقضية السبعة التي يسمّيها المسح فرادى
                  هي وحدها المظلَّلة؛ والأرقام لا تُجمع مع التقديرات الساتلية
                  ولا مع أي تقييم لسنة 2026.
                </>
              ) : (
                <>
                  Municipal declaration, not engineering assessment:{" "}
                  {districtDamage.totals.areasSurveyed} affected areas across{" "}
                  {districtDamage.totals.districtsCovered} districts and{" "}
                  {districtDamage.totals.governoratesCovered} governorates, 5-15
                  December 2024, reporting{" "}
                  {districtDamage.totals.housingUnits.toLocaleString("en-US")}{" "}
                  damaged housing units ({districtDamage.totals.completelyDamagedShare}%
                  completely damaged) within{" "}
                  {districtDamage.totals.reportedAssets.toLocaleString("en-US")}{" "}
                  reported assets. Only the seven districts the survey names
                  individually are shaded; the figures are not additive with
                  satellite estimates or with any 2026 assessment.
                </>
              )}
            </p>
          ) : null}
          {view === "damage" ? (
            <p className="mt-1.5 rounded-md border border-border bg-white px-3 py-2 text-[11px] leading-relaxed text-text-secondary">
              {locale === "ar" ? (
                <>
                  لم تُقيَّم بحلول تاريخ التوقف في 31 تموز 2026 سوى منطقتين:{" "}
                  <strong className="text-navy">جنوب الليطاني</strong>{" "}
                  ({destruction.zones2026[0].assessedDamageAr}؛ 11,095 مبنى
                  مدمَّراً كلياً؛ ذكاء اصطناعي جغرافي بتدقيق مكتبي ومن دون
                  تثبيت ميداني) و
                  <strong className="text-navy">بيروت وجبل لبنان</strong>{" "}
                  ({destruction.zones2026[1].assessedDamageAr}؛ بفحص ميداني).
                  المنتجان يختلفان في المنهجية ولا يجوز مقارنتهما ولا جمعهما.
                  والجغرافيا المقيَّمة ليست الجغرافيا المتضررة: فالتتبّع الوطني
                  الآني رصد ضربات عنيفة في المناطق التي بلغتها الحرب، ولم يكن
                  للبقاع وبعلبك-الهرمل أي تقييم مواز.
                </>
              ) : (
                <>
                  Only two zones were assessed by the 31 July 2026 cut-off:{" "}
                  <strong className="text-navy">South of the Litani</strong>{" "}
                  ({destruction.zones2026[0].assessedDamage}; 11,095 buildings
                  completely destroyed; desk-validated GeoAI, no field
                  confirmation) and{" "}
                  <strong className="text-navy">Beirut &amp; Mount Lebanon</strong>{" "}
                  ({destruction.zones2026[1].assessedDamage}; field-checked). The
                  two products differ in method and must not be compared or
                  summed. Assessed geography is not damaged geography: the
                  real-time national database traced heavy strikes across the
                  areas the war reached, and the Bekaa and Baalbek-Hermel had no
                  equivalent assessment.
                </>
              )}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
