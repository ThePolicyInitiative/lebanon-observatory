"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHART, LAYER_META, UI, VALENCE } from "@/lib/colors";
import { locations } from "@/lib/data-client";
import type { SlimRecord } from "@/lib/map-records";
import {
  DISTRICT_PATHS,
  DISTRICT_LABELS,
  GOV_PATHS,
  CITY_LABELS,
  TOWN_SEARCH_ALIASES,
  LITANI_LABEL_ANCHOR,
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
import {
  AR_COUNT,
  arabicCount,
  layers,
  regionLabel,
  stageList,
  type Locale,
} from "@/lib/vocab";
import {
  buildPins,
  chipBackground,
  clampToLand,
  fanRadius,
  fitSpacing,
  JURISDICTION_ONLY_PLACES,
  episodeRing,
  pinOutline,
  type Pin,
} from "@/lib/pins";
import { buildLandIndex, isOnLandIndexed, type LandIndex } from "@/lib/land";
import {
  labelBox,
  packLabels,
  packReserved,
  type LabelBox,
  type LabelCandidate,
} from "@/lib/map-labels";
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

/**
 * The point below which a fan stops being worth drawing.
 *
 * A pin is 7.4 px across, and a Lebanese town at the opening view is about
 * ten pixels wide - so one pin is very nearly the size of the town it sits
 * in. Twenty entries cannot be drawn apart inside a shape that small, and
 * the two ways of failing are both real: fan them wide enough to separate
 * and they land in the neighbouring towns; keep them inside the town and
 * they pile into a single illegible blob.
 *
 * So neither is done. Below this separation the town is drawn as one
 * marker carrying its count, which is true at any zoom, and the fan opens
 * into a pin per entry only once the town on screen is big enough to hold
 * them apart. Selecting the marker lists the same entries in the panel, so
 * nothing becomes unreachable at any zoom.
 */
const PIN_MIN_SEPARATION = 2 * (PIN_R + PIN_STROKE / 2);

/**
 * The damage view's badge radii, in one place.
 *
 * The label packing has to reserve exactly the disc the JSX draws. Two
 * copies of `6.5 + sqrt(d/max) * 10` would be two chances to drift, and a
 * reserved disc that is not the drawn disc is worse than no reservation:
 * it rejects labels that would have fitted and admits ones that will not.
 */
const DAHIEH_R = 9;
/** The Dahieh marker is not a cadaster, so it needs a key of its own. */
const DAHIEH_KEY = "__dahieh";

const PIN_T = {
  en: {
    pinCount: (pins: number, places: number) =>
      `${pins} pins across ${places} places - select one for its entry`,
    entryAt: "Traced entry ·",
    episodeAt: "Traced episode ·",
    close: "Close this entry",
    pinNote:
      "One pin, one traced entry. The pin sits in the town the reporting names, fanned off its centre so neighbouring entries stay separate - it is not a street address. Where a town is too small at this zoom to hold its entries apart, they are drawn as one marker carrying the count; zoom in and it opens into a pin for each.",
    cluster: (n: number, town: string, district: string) =>
      `${town}${district ? `, ${district}` : ""} - ${n} traced entries, too close together to draw apart at this zoom. Select to list them, or zoom in for a pin each.`,
    clusterPanel: (n: number) => `${n} traced entries here`,
    happenedHere: "What happened here",
    findTown: (n: string) => `Find a town (${n} cadastral towns - selecting zooms to it)`,
    loading: "loading",
    searchPlaceholder: "e.g. Aaintaroun (Bent Jbeil)",
    zoomReadout: (z: string) => `×${z} zoom`,
    mapAria: (year: number, occupation: boolean) =>
      `Town-level map of Lebanon shaded by located traced activities for ${year}.${occupation ? " Hatched towns form the Blue Line border strip with traced Israeli occupation." : ""} Zoom with the wheel, drag or double-click; use the town search box for keyboard access to individual towns.`,
    baseTitle: (name: string, zone: string, year: number) =>
      `${name} - ${zone} (${year})`,
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
    dahieh: "Dahieh belt: 93% of Beirut-ML debris",
    dmgAria: (label: string, n: string) =>
      `${label}: ${n} buildings completely destroyed in the 2026 assessment`,
    dmgTitle: (label: string, n: string) =>
      `${label}: ${n} buildings completely destroyed - South of the Litani assessment, 29 April 2026 imagery, desk-validated`,
    stageTip: (no: number, name: string, c: number) =>
      `${no}. ${name}: ${c} ${c === 1 ? "entry" : "entries"}`,
    stagesCaption: (present: number) =>
      `stages of the response 1-12 (hover for names) - ${present} of 12 present`,
    zoneScaleNote:
      "The group breakdown reads at the regional-grouping level; town boundaries are shown for geographic orientation.",
    mentionsCaution:
      "Traced activity in the tracking - not damage severity, expenditure or coverage.",
    groupOrder: (names: string) =>
      `Groups from most to least traced activity here: ${names}.`,
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
      `${arabicCount(pins, AR_COUNT.pin)} في ${arabicCount(places, AR_COUNT.place)} - اختر واحداً لعرض مدخله`,
    entryAt: "مدخل مرصود ·",
    episodeAt: "واقعة مرصودة ·",
    close: "إغلاق هذا المدخل",
    pinNote:
      "دبّوس واحد لمدخل مرصود واحد. والدبّوس يقع في البلدة التي يسمّيها الإبلاغ، منشوراً عن مركزها ليبقى كل مدخل منفصلاً - وهو ليس عنواناً في شارع. وحين تضيق البلدة عند هذا التكبير عن أن تفصل مداخلها، تُرسم علامة واحدة تحمل العدد؛ وبالتقريب تنفتح إلى دبّوس لكل مدخل.",
    cluster: (n: number, town: string, district: string) =>
      `${town}${district ? ` · قضاء ${district}` : ""} - ${arabicCount(n, AR_COUNT.entryTraced)}، أقرب من أن تُرسم متفرّقة عند هذا التكبير. اخترها لعرضها، أو قرّب الخريطة ليظهر دبّوس لكل مدخل.`,
    clusterPanel: (n: number) => `${arabicCount(n, AR_COUNT.entryTraced)} هنا`,
    happenedHere: "ما الذي جرى هنا",
    findTown: (n: string) => `ابحث عن بلدة (${n} بلدة عقارية - اختيارها يقرّب الخريطة إليها)`,
    loading: "قيد التحميل",
    searchPlaceholder: "مثال: Aaintaroun (Bent Jbeil)",
    zoomReadout: (z: string) => `تكبير ×${z}`,
    mapAria: (year: number, occupation: boolean) =>
      `خريطة لبنان على مستوى البلدات مظلَّلة بالنشاط المرصود المحدَّد الموقع لسنة ${year}.${occupation ? " البلدات المخطَّطة تشكّل شريط الخط الأزرق الحدودي حيث رُصد احتلال إسرائيلي." : ""} قرّب بالعجلة أو السحب أو النقر المزدوج؛ ومربّع البحث عن بلدة يتيح الوصول إلى البلدات بلوحة المفاتيح.`,
    baseTitle: (name: string, zone: string, year: number) =>
      `${name} - ${zone} (${year})`,
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
      `${name} · قضاء ${district} - ${arabicCount(dCount, AR_COUNT.activityTraced)} في هذا القضاء${namedCount > 0 ? `، منها ${namedCount} تسمّي هذه البلدة` : ""}`,
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
    stageTip: (no: number, name: string, c: number) => `${no}. ${name}: ${arabicCount(c, AR_COUNT.entry)}`,
    stagesCaption: (present: number) =>
      `مراحل الاستجابة 1-12 (مرّر المؤشر للأسماء) - ${present} من 12 حاضرة`,
    zoneScaleNote:
      "تفصيل المجموعات يُقرأ على مستوى التجمّع الإقليمي؛ وحدود البلدات معروضة للتوجيه الجغرافي.",
    mentionsCaution: "نشاط مرصود في التتبّع - لا شدّة الضرر ولا الإنفاق ولا التغطية.",
    groupOrder: (names: string) =>
      `المجموعات من الأكثر نشاطاً مرصوداً هنا إلى الأقل: ${names}.`,
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
      <h4 className="text-micro font-bold uppercase tracking-wide text-text-secondary">
        {PIN_T[locale].happenedHere}
      </h4>
      <ul className="mt-1.5 space-y-2">
        {events.map((e, i) => {
          const meta = EVENT_KIND_META[e.kind];
          return (
            <li key={i} className="text-meta leading-relaxed">
              <span
                className="me-1.5 rounded-sm px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide"
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

/**
 * A polygon id, and a type a town name cannot be assigned to.
 *
 * The plain `string` this used to be is why the hover highlight silently
 * stopped working: the state is compared against `Town.uid`, which always
 * carries a `#index` suffix, and two call sites wrote a bare name into it.
 * A name is a `string`, so it assigned cleanly, never matched anything,
 * and drew nothing - the readout text comes from separate state, so the
 * label still appeared and the missing outline read as a design choice.
 * Branding the id makes that a compile error instead.
 */
type TownUid = string & { readonly __townUid: unique symbol };

type Town = {
  /** Unique per polygon (names are not unique in the boundary data). */
  uid: TownUid;
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
};

/**
 * Where a town's pins are fanned from, and how much room the fan has
 * before it reaches the boundary.
 *
 * Not the centroid: that is the average of a shape rather than a point
 * inside it, and for a coastal sliver like Sour it sits 54 m from its own
 * edge, which put entries in the next town along.
 *
 * Worked out on demand rather than for the whole cadastre. The search
 * costs about 1.2 ms a town - trivial for the thirty-odd towns the
 * tracking reaches, and 1.9 seconds of frozen main thread if run over all
 * 1,627 polygons on load, which is what it did until it was measured.
 */
type Anchor = { x: number; y: number; room: number };

type ViewBox = { x: number; y: number; w: number; h: number };

const ASPECT = VIEW_H / VIEW_W;
const HOME: ViewBox = { x: 0, y: 0, w: VIEW_W, h: VIEW_H };
/**
 * How far in this map can be zoomed.
 *
 * It was VIEW_W / 18, and the pan-and-zoom map's ceiling was raised to
 * zoom 15 precisely so a busy town's fan could open. This one - the
 * default, the server-rendered one, and the only map at all without
 * WebGL - was left at eighteen times, which is not enough for the
 * tightest towns. Saida El-Qadimeh has 235 m of room around its anchor;
 * its six entries need the rendered map about 680 CSS px wide before
 * they clear each other, so on every phone and tablet, and on any desktop
 * window under roughly 835 px tall, those entries stayed a counted marker
 * at every zoom the map offered - while the marker told the reader to
 * zoom in for a pin each.
 *
 * Forty-five times clears every town in both years at 300 px and above.
 */
const MIN_W = VIEW_W / 45;

/**
 * The overview thumbnail, sized from the projection rather than from
 * memory.
 *
 * It was 56x78, which matched the old 620x860 box. Once VIEW_H became
 * 800 the drawing letterboxed inside it - and because the click that
 * recentres the map reads the ratio, a click near the bottom aimed at
 * ground the thumbnail was not drawing.
 */
const MINI_W = 56;
const MINI_H = Math.round(MINI_W * (VIEW_H / VIEW_W));

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
  /**
   * Focus handling for the panel a pin opens.
   *
   * Every pin is its own tab stop and the panel is a sibling of the whole
   * map, so a reader who activated the first pin had to pass 199 more of
   * them to reach what they had just opened. Moving focus into the panel
   * on activation, and back to the pin it came from on close, means the
   * thing that just appeared is the next thing reached.
   */
  const panelHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const pinOpenerRef = useRef<SVGGElement | null>(null);
  /**
   * The town whose counted marker is open, and the entries behind it.
   *
   * A counted marker stands for entries that have no pin of their own at
   * this zoom, and its own accessible name promises "select to list them".
   * It was calling selectTown and nothing else, which opens a panel of
   * per-layer bars - so the promise was not kept, and the entries behind
   * the 27 markers at the opening view had no element anywhere: nothing
   * to focus, nothing to open, 195 of 200 unreachable without a pointer
   * and a zoom.
   */
  const [openCluster, setOpenCluster] = useState<{
    town: Town;
    pins: (Pin & { town: Town })[];
  } | null>(null);
  const clusterHeadingRef = useRef<HTMLHeadingElement | null>(null);
  /** The overview drawing, so a click on it is measured against itself. */
  const miniRef = useRef<SVGSVGElement | null>(null);
  /** Set when a pin is closed, so focus returns only then - not on open. */
  const restoreFocusRef = useRef(false);
  const [districtOutlines, setDistrictOutlines] = useState<
    { name: string; d: string }[]
  >([]);
  const [govOutlines, setGovOutlines] = useState<string[]>([]);
  const [stripOutline, setStripOutline] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  /** Town polygons by uid, and their resolved anchors. See anchorOf. */
  const featuresRef = useRef<Map<string, GeoFeature>>(new Map());
  const anchorCacheRef = useRef<Map<string, Anchor>>(new Map());
  /**
   * The selected town twice over, and the two are not interchangeable.
   * `Raw` is the name, which is the key the location matcher emits and so
   * the key the entry lists are grouped under; `Uid` is the polygon, which
   * is what a shape is drawn from. Reading one where the other is meant is
   * what the branded type below now prevents.
   */
  const [selectedTownRaw, setSelectedTownRaw] = useState<string | null>(null);
  const [selectedTownUid, setSelectedTownUid] = useState<TownUid | null>(null);
  const [selectedOccupation, setSelectedOccupation] = useState<"" | "strip" | "district">("");
  const [search, setSearch] = useState("");
  /** The hover readout text, and the polygon to outline while it shows. */
  const [hover, setHover] = useState<string | null>(null);
  const [hoverUid, setHoverUid] = useState<TownUid | null>(null);
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
          return {
            // Unique per polygon: 65 disputed areas share the name
            // "Litige", so name alone cannot identify a shape.
            uid: `${name}#${i}` as TownUid,
            d: toSvgPath(f),
            name,
            district,
            zoneId: zoneForCodAdm1(String(f.properties.adm1_name ?? "")),
            occupied: OCCUPIED_COD_DISTRICTS_2026.includes(district),
            strip: strip.has(name),
            cx: c.x,
            cy: c.y,
          };
        });
        // Kept so an anchor can be worked out for a town when one is
        // actually wanted. The rings are already retained by the land
        // index built below, so this holds no geometry that was going to
        // be freed.
        featuresRef.current = new Map(out.map((t, i) => [t.uid, gj.features[i]] as const));
        anchorCacheRef.current.clear();
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
    // A familiar English name the map does not print. Resolved before the
    // exact match, so typing Tyre reaches the town the face calls Sour.
    const typed = value.trim().toLowerCase();
    const aliased = Object.entries(TOWN_SEARCH_ALIASES).find(
      ([from]) => from.toLowerCase() === typed,
    )?.[1];
    if (aliased) {
      const t = towns.find((x) => x.name === aliased);
      if (t) {
        selectTown(t);
        setVb(vbAround(anchorOf(t).x, anchorOf(t).y, VIEW_W / 5));
        return;
      }
    }
    const m = value.match(/^(.*) \(([^)]+)\)$/);
    if (!m) return;
    const t = towns.find((x) => x.name === m[1] && x.district === m[2]);
    if (t) {
      selectTown(t);
      setVb(vbAround(anchorOf(t).x, anchorOf(t).y, VIEW_W / 5));
    }
  }

  const selectedTownName = selectedTownRaw;

  /** Place-name index over the loaded town layer. */
  const locIndex = useMemo(() => (towns ? buildLocationIndex(towns) : null), [towns]);

  /**
   * A town's fan anchor, found the first time it is asked for and kept.
   *
   * Falls back to the centroid for a polygon so degenerate it leaves no
   * room at all, which is the same thing the pan-and-zoom map does.
   */
  /**
   * Escape closes the open pin from anywhere on the page.
   *
   * The panel's own handler only fires while focus is inside it, which
   * is not where a reader who opened a pin by pointer is standing. This
   * catches the other case, and mirrors what ChangeHeatmap already does.
   */
  useEffect(() => {
    if (!openPin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      restoreFocusRef.current = true;
      setOpenPin(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openPin]);

  // Move focus to the panel when a pin opens it, and back to that pin
  // when it closes. Guarded on restoreFocusRef so that a pin opened by
  // pointer does not have focus yanked back to a pin nobody is on.
  useEffect(() => {
    if (openPin) {
      panelHeadingRef.current?.focus();
      return;
    }
    if (openCluster) {
      clusterHeadingRef.current?.focus();
      return;
    }
    if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      pinOpenerRef.current?.focus();
    }
  }, [openPin, openCluster]);

  /**
   * A panel outlives the thing it describes when the year or a filter
   * changes underneath it: the entry it names may no longer be drawn, and
   * the marker its focus would return to is gone. Both close.
   *
   * Done while rendering rather than in an effect. This is React's own
   * pattern for resetting state when a prop changes - the component
   * re-renders immediately with the new state and nothing stale is ever
   * painted, where an effect would show the wrong panel for a frame and
   * eslint would object besides. The entries prop is memoised by the
   * caller, so the identity check only fires when the filters move.
   */
  const [panelFor, setPanelFor] = useState<{ year: Year; entries: SlimRecord[] }>({
    year,
    entries: records,
  });
  if (panelFor.year !== year || panelFor.entries !== records) {
    setPanelFor({ year, entries: records });
    setOpenPin(null);
    setOpenCluster(null);
  }

  const anchorOf = useCallback((town: Town): Anchor => {
    const hit = anchorCacheRef.current.get(town.uid);
    if (hit) return hit;
    const f = featuresRef.current.get(town.uid);
    const a = f ? featureAnchor(f) : { x: town.cx, y: town.cy, room: 0 };
    const anchor: Anchor = a.room > 0 ? a : { x: town.cx, y: town.cy, room: 0 };
    anchorCacheRef.current.set(town.uid, anchor);
    return anchor;
  }, []);

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
    /*
     * First polygon wins, which is what placePoints, entryPinsRaw and
     * buildLocationIndex all do. Built through the Map constructor this
     * was LAST-wins, so for the one genuinely duplicated town name in the
     * boundary layer - Kafr, in Jbeil and in Akkar - this resolver alone
     * picked the northern polygon while every other path picked the
     * southern one. No assessment names Kafr today, so nothing moved on
     * screen; a resolver that disagrees with its three siblings about
     * which shape a name means is a trap either way, and this one could
     * put a damage badge in the north, where the tracking attributes
     * nothing.
     */
    const byName = new Map<string, Town>();
    for (const t of towns) if (!byName.has(t.name)) byName.set(t.name, t);
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
  /** One definition, so the reserved disc is the drawn disc. */
  const damageRadius = useCallback(
    (destroyed: number) => 6.5 + Math.sqrt(destroyed / maxDestroyed) * 10,
    [maxDestroyed],
  );

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
      // A place named only as an official's remit draws no pin, and it
      // cannot be ranked or counted as one either: Baalbek was holding
      // eighth place on the panel beside a map that deliberately shows
      // nothing there, and was counted among the "places" in the legend.
      // One suppression, applied everywhere the map speaks.
      if (JURISDICTION_ONLY_PLACES.has(name)) continue;
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
      return [] as (Pin & {
        town: Town;
        cx: number;
        cy: number;
        room: number;
        siblings: number;
      })[];
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
    const out: (Pin & {
      town: Town;
      cx: number;
      cy: number;
      room: number;
      siblings: number;
    })[] = [];
    for (const [name, pins] of grouped) {
      const t = byName.get(name);
      if (!t) continue;
      // One anchor per town, not per pin - this is where the search is
      // paid for, and only for towns that carry something.
      const a = anchorOf(t);
      for (const pin of pins)
        out.push({ ...pin, town: t, cx: a.x, cy: a.y, room: a.room, siblings: pins.length });
    }
    return out;
  }, [towns, locIndex, records, year, locale, anchorOf]);

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
  const { entryPins, entryClusters } = useMemo(() => {
    const byTown = new Map<string, typeof entryPinsRaw>();
    for (const pin of entryPinsRaw) {
      const list = byTown.get(pin.townName);
      if (list) list.push(pin);
      else byTown.set(pin.townName, [pin]);
    }

    const pins: (typeof entryPinsRaw)[number][] = [];
    const clusters: {
      town: Town;
      count: number;
      pins: typeof entryPinsRaw;
      ax: number;
      ay: number;
      /** Drawn radius in screen px, capped below so discs cannot overlap. */
      radius: number;
    }[] = [];

    for (const [, group] of byTown) {
      const town = group[0].town;
      const spacing = fitSpacing(group.length, group[0].room / k, PIN_SPACING);
      // Too tight to tell apart: one marker for the town instead.
      if (group.length > 1 && spacing < PIN_MIN_SEPARATION) {
        clusters.push({
          town,
          count: group.length,
          pins: group,
          ax: group[0].cx,
          ay: group[0].cy,
          // Provisional; capped against the neighbours once all are known.
          radius: PIN_R + Math.sqrt(group.length) * 1.3,
        });
        continue;
      }
      for (const pin of group) {
        const moved = clampToLand(
          pin.cx,
          pin.cy,
          pin.dx * spacing * k,
          pin.dy * spacing * k,
          (x, y) =>
            landIndex
              ? isOnLandIndexed(landIndex, x, y)
              : (() => {
                  const { lon, lat } = unprojectPoint(x, y);
                  return isOnLand(lon, lat);
                })(),
        );
        pins.push({ ...pin, dx: moved.dx / k, dy: moved.dy / k });
      }
    }
    /*
     * A marker's radius grows with its count, and until now nothing
     * stopped one town's disc from covering its neighbour's. The
     * clustering rule separates a town from itself and says nothing about
     * the town next door: around Nabatieh and through the Dahieh belt,
     * ten pairs of markers overlapped at 620 px and twenty-three at 375,
     * each opaque white disc hiding part of the one drawn before it and
     * printing its number over the other's.
     *
     * So a marker may not grow past half the distance to its nearest
     * neighbour, whether that neighbour is another marker or a pin.
     *
     * That does not reach zero, and cannot. The floor is one pin radius,
     * so two towns whose anchors are less than 7.4 px apart still touch -
     * at that separation they cannot be drawn as two discs by any rule,
     * and shrinking further would leave a marker too small to carry its
     * own number. What the cap removes is every overlap that was avoidable:
     * on a 375 px phone at the opening view, 28 overlapping pairs become
     * 8; at 620 px, 10 become 2; at 732 px, 8 become 1. The rest resolve
     * by zooming, which now goes far enough to open every fan.
     */
    for (const c of clusters) {
      let nearest = Infinity;
      for (const other of clusters) {
        if (other === c) continue;
        nearest = Math.min(nearest, Math.hypot(other.ax - c.ax, other.ay - c.ay) / k);
      }
      for (const p of pins) {
        const d = Math.hypot(p.cx + p.dx - c.ax, p.cy + p.dy - c.ay) / k;
        if (d > 0) nearest = Math.min(nearest, d);
      }
      const wanted = PIN_R + Math.sqrt(c.count) * 1.3;
      c.radius = Number.isFinite(nearest)
        ? Math.max(PIN_R, Math.min(wanted, nearest / 2 - PIN_STROKE))
        : wanted;
    }

    return { entryPins: pins, entryClusters: clusters };
  }, [entryPinsRaw, k, landIndex]);

  /**
   * Whether a marker at these map coordinates is inside the current view.
   *
   * The map is clipped by its viewBox rather than by scrolling, so a
   * marker outside the view is not merely off-screen - the browser has no
   * way to bring it into view when it takes focus. At the tightest zoom
   * that left 199 of 200 markers focusable but invisible, so tabbing
   * moved focus to somewhere the reader could not see and could not
   * reach. What cannot be seen is not offered; zooming back out returns
   * it. A small margin keeps a marker on the edge reachable.
   */
  const inView = useCallback(
    (x: number, y: number) => {
      const m = Math.max(vb.w, vb.h) * 0.02;
      return x >= vb.x - m && x <= vb.x + vb.w + m && y >= vb.y - m && y <= vb.y + vb.h + m;
    },
    [vb],
  );

  /** Clustered towns by name, so a label can clear the marker it drew. */
  const clusterByTown = useMemo(
    () => new Map(entryClusters.map((c) => [c.town.name, c] as const)),
    [entryClusters],
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
  /**
   * Which town names get printed, at whatever zoom the reader is at.
   *
   * There were two rules before, and the map used whichever the zoom
   * selected. The national one took the six busiest towns with no test
   * between them at all, so on a phone seven of the thirteen strings on
   * screen overlapped another - "Tayr Debbeh 12" across "Chehour 8",
   * "Qana 8" across "Tibnine 8". The zoomed one did avoid collisions, but
   * only against other town labels: the city and district labels are
   * drawn unconditionally and were invisible to it, so "Nabatieh" printed
   * straight through "Nabatieh Et-Tahta 22" at every zoom to the deepest.
   *
   * One rule now, and it measures boxes rather than distances between
   * centres. A place name is far wider than it is tall, so a radius is
   * the wrong shape to reserve for it: two labels a comfortable radius
   * apart still overlap if they run towards each other. The labels that
   * are drawn unconditionally claim their boxes first, which is both
   * correct and free, and the town labels fill what is left in order of
   * traced volume. How many fit falls out of the geometry.
   */
  const visibleLabels = useMemo(() => {
    // Drawn at every zoom, so they are the first claimants.
    const cityPoints = CITY_LABELS.map((c) => ({ ...c, ...projectPoint(c.lon, c.lat) }));

    /*
     * The unconditional labels, thinned against each other first.
     *
     * They were all reserved and none tested, so where a district label
     * sits under the city that names it the two printed on top of each
     * other - "BEIRUT" through "Beirut" - at every zoom the district
     * layer is on. Cities come first because they are drawn at every
     * zoom and a district label only below 0.55; the river last, since
     * it is the one a reader can place from the line itself.
     */
    const reservedCandidates = [
      ...cityPoints.map((c) => ({
        key: `city:${c.name}`,
        box: labelBox(c.x + 4.5 * k, c.y - 3.5 * k, c.name, 10.5 * k),
      })),
      ...(zoom <= 0.55
        ? DISTRICT_LABELS.map((l) => ({
            key: `district:${l.name}`,
            // Uppercase and letter-spaced, exactly as the layer below
            // draws it: measured mixed-case and unspaced, every district
            // name was handed to the packing 5-38% narrower than it prints.
            box: labelBox(l.x, l.y, l.label, 9.5 * k, "middle", {
              uppercase: true,
              letterSpacing: 0.4 * k,
            }),
          }))
        : []),
      {
        key: "litani",
        box: labelBox(LITANI_LABEL_ANCHOR.x, LITANI_LABEL_ANCHOR.y - 4 * k, "Litani", 9.5 * k),
      },
    ];
    const { kept: reservedKept, boxes: reserved } = packReserved(reservedCandidates);

    /*
     * The damage view draws its own labels and used to draw them through
     * everything: this memo had no `view` in it at all, so whichever view
     * was on screen it packed the ENTRIES data - town names that the
     * damage view never prints - while the four cadaster labels and the
     * Dahieh label went out unfiltered. They printed through each other,
     * through the destroyed-building counts in neighbouring badges, and
     * through the district names, which are drawn in this view too.
     *
     * Each badge reserves its disc so a label cannot cross a number, and
     * each label is exempted from its own disc, which it sits under by
     * construction. Nothing moves on screen; what changes is which label
     * gives way when two cannot both be read.
     */
    if (view === "damage") {
      const discs = new Map<string, LabelBox>();
      for (const a of damageAnchors) {
        const r = damageRadius(a.destroyed) * k;
        const box = { x0: a.town.cx - r, y0: a.town.cy - r, x1: a.town.cx + r, y1: a.town.cy + r };
        discs.set(a.label, box);
        reserved.push(box);
      }
      const baabda = DISTRICT_LABELS.find((l) => l.name === "Baabda");
      if (baabda) {
        const r = DAHIEH_R * k;
        const box = { x0: baabda.x - r, y0: baabda.y - r, x1: baabda.x + r, y1: baabda.y + r };
        discs.set(DAHIEH_KEY, box);
        reserved.push(box);
      }
      const damageCandidates: LabelCandidate<string>[] = [
        // Dahieh first: it names the single heaviest concentration in the
        // 2026 assessment, so where it and a cadaster cannot both fit it
        // is the one that stays.
        ...(baabda
          ? [
              {
                key: DAHIEH_KEY,
                box: labelBox(baabda.x, baabda.y + 16 * k, tr.dahieh, 9.5 * k, "middle"),
                own: discs.get(DAHIEH_KEY),
              },
            ]
          : []),
        ...damageAnchors.map((a) => ({
          key: a.label,
          box: labelBox(
            a.town.cx,
            a.town.cy + (damageRadius(a.destroyed) + 9) * k,
            a.label,
            9.5 * k,
            "middle" as const,
          ),
          own: discs.get(a.label),
        })),
      ];
      return {
        towns: new Set<string>(),
        reserved: reservedKept,
        damage: packLabels(damageCandidates, reserved),
      };
    }

    // The markers themselves, which are drawn whatever the labels do. A
    // name that clears every other name can still print straight across
    // a neighbouring town's counted marker, and the number inside it is
    // the thing that becomes unreadable.
    for (const c of entryClusters) {
      const r = c.radius * k;
      reserved.push({ x0: c.ax - r, y0: c.ay - r, x1: c.ax + r, y1: c.ay + r });
    }
    for (const p of entryPins) {
      const r = PIN_R * k;
      const x = p.cx + p.dx * k;
      const y = p.cy + p.dy * k;
      reserved.push({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
    }

    const candidates = placePoints
      // A town the city labels already name would print the same place
      // twice over. That is a fact about the names, not about the zoom,
      // so the distance here stays in ground units and is not scaled.
      .filter(
        (p) =>
          !cityPoints.some((c) => Math.hypot(c.x - p.town.cx, c.y - p.town.cy) < 14),
      )
      .map((p) => {
        const a = anchorOf(p.town);
        const cluster = clusterByTown.get(p.town.name);
        const reach = cluster
          ? cluster.radius
          : fanRadius(p.total, fitSpacing(p.total, a.room / k, PIN_SPACING));
        return {
          key: p.town.name,
          box: labelBox(
            a.x + (reach + 5) * k,
            a.y + 3 * k,
            `${p.town.name} ${p.total}`,
            9.5 * k,
          ),
        };
      });

    return {
      towns: packLabels(candidates, reserved),
      reserved: reservedKept,
      damage: new Set<string>(),
    };
    // `view` is load-bearing: without it the memo packed the entries data
    // whichever view was on screen, and the damage view got a set of town
    // names it never draws.
  }, [
    placePoints,
    k,
    zoom,
    view,
    anchorOf,
    clusterByTown,
    entryClusters,
    entryPins,
    damageAnchors,
    damageRadius,
    tr,
  ]);

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
  /**
   * Adaptive scale bar: a round distance that stays 40–150 px on screen.
   *
   * The half- and fifth-kilometre steps matter now the map zooms to
   * forty-five times. Without them the list bottoms out at 1 km, which at
   * the deepest zoom draws a bar over 200 px wide - no longer a scale so
   * much as a stripe across the map.
   */
  const scaleKm =
    [100, 50, 25, 10, 5, 2, 1, 0.5, 0.2].find((km) => (km * PX_PER_KM) / k <= 150) ?? 0.2;
  const scaleLen = scaleKm * PX_PER_KM;

  return (
    <div>
      {note ? (
        <p className="mb-2 rounded-md border border-border bg-white px-3 py-2 text-meta text-text-secondary">
          {note}
        </p>
      ) : null}

      {/* Town search */}
      <div className="mb-3">
        <label htmlFor="town-search" className="block text-micro font-semibold text-text-secondary">
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
          className="mt-1 min-h-11 w-full max-w-md rounded-md border border-border bg-white px-2.5 text-body"
        />
        <datalist id="town-list">
          {/* Offered so the exonym is discoverable, not only accepted. */}
          {Object.keys(TOWN_SEARCH_ALIASES).map((a) => (
            <option key={`alias-${a}`} value={a} />
          ))}
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
      <p className="mb-2 text-end text-micro tabular-nums text-text-secondary">
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
          {/*
           * dir belongs on the <svg>, not on this wrapper.
           *
           * The map's geometry has to stay left-to-right or the country
           * mirrors, so the whole box was forced to ltr. That also caught
           * every piece of Arabic text drawn inside it - the hover
           * readout, the town and pin tooltips, the damage badges and the
           * scale bar - and laid each one out in a left-to-right
           * paragraph, which reverses the order its runs are read in. A
           * hover line that should read as town, then district, then
           * count came out with the count first.
           *
           * So the direction sits on the <svg>, where it keeps the
           * projection honest, and the text nodes that carry Arabic get
           * their own direction back below.
           */}
          <div className="relative mx-auto w-full max-w-[min(82vh,46rem)] select-none overflow-hidden rounded-lg border-2 border-[#c9d4e0] bg-[#E9EDF2] shadow-[0_2px_16px_rgba(23,59,99,0.10)]">
            <svg
              ref={svgRef}
              viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
              role="group"
              aria-label={tr.mapAria(year, showOccupation)}
              className={`block h-auto w-full ${dragging ? "cursor-grabbing" : ""}`}
              // `direction` rather than the dir attribute, which React's
              // SVG typings do not carry - it is the CSS property that
              // actually governs bidi, and it keeps the labels drawn
              // inside the projection laid out left to right.
              style={{ direction: "ltr", touchAction: zoomed ? "none" : "pan-y" }}
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
                  // Districts outside the zones the war reached are drawn
                  // as land and named, and that is all: a zero-activity
                  // tooltip on a northern district invites the reader to
                  // read absence of tracing as absence of activity, when
                  // there was nothing there to trace. The traced zones get
                  // name and grouping only - the filtered value would be a
                  // single group's regional total when a group filter is
                  // set, and group totals never print.
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
                        {/* Only traced zones reach regionLabel, and every
                            traced zone has a grouping, so there is no
                            fallback branch here to leak a raw name. */}
                        {traced
                          ? tr.baseTitle(p.name, regionLabel(p.zoneId, locale), year)
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
                // Taken from the drawn line rather than written down
                // beside it. The anchor used to be a hardcoded lon/lat
                // that missed the river by 23.5 units - about 5.6 km -
                // and printed the word over Jibchit, a town carrying its
                // own pins. Worse, the gap grew on screen with every zoom
                // step, because the anchor is a map coordinate while the
                // glyphs are held at a constant pixel size by k. Riding
                // the geometry means it cannot drift again.
                const anchor = LITANI_LABEL_ANCHOR;
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
                ? DISTRICT_LABELS.filter((l) =>
                    visibleLabels.reserved.has(`district:${l.name}`),
                  ).map((l) => (
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
                      {l.label}
                    </text>
                  ))
                : null}

              {/* Major-city reference labels */}
              {CITY_LABELS.filter((c) => visibleLabels.reserved.has(`city:${c.name}`)).map((c) => {
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
                    // The polygon, not the name: two towns can share one.
                    const isSel = selectedTownUid === pin.town.uid;
                    const rp = PIN_R * (isSel ? 1.4 : 1);
                    const edge = isSel ? "#173B63" : pinOutline(pin.color);
                    const label = `${pin.title} - ${pin.townName}${pin.district ? `, ${pin.district}` : ""} · ${pin.detail}`;
                    return (
                      <g
                        key={pin.id}
                        transform={`translate(${pin.cx} ${pin.cy}) scale(${k}) translate(${pin.dx} ${pin.dy})`}
                        tabIndex={inView(pin.cx + pin.dx * k, pin.cy + pin.dy * k) ? 0 : -1}
                        role="button"
                        aria-label={label}
                        className="group/pin cursor-pointer focus-visible:outline-2 focus-visible:outline-blue"
                        onClick={(e) => {
                          pinOpenerRef.current = e.currentTarget;
                          setOpenPin(pin);
                          selectTown(pin.town);
                        }}
                        onPointerEnter={() => {
                          setHover(label);
                          setHoverUid(pin.town.uid);
                        }}
                        onPointerLeave={() => {
                          setHover(null);
                          setHoverUid(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            pinOpenerRef.current = e.currentTarget;
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
                        {/* The episode ring takes no selection override.
                            `edge` carries one because a selected entry dot
                            keeps its fill and only changes its rim; an
                            episode's ring IS the mark, so painting it navy
                            would erase the layer it names. */}
                        <circle
                          r={rp}
                          fill={pin.kind === "episode" ? "#FFFFFF" : pin.color}
                          stroke={pin.kind === "episode" ? episodeRing(pin.color) : edge}
                          strokeWidth={pin.kind === "episode" ? PIN_STROKE * 2 : PIN_STROKE}
                          className="pointer-events-none transition-transform duration-100 group-hover/pin:scale-150 group-focus-visible/pin:scale-150"
                          style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        />
                        <title>{label}</title>
                      </g>
                    );
                  })
                : null}

              {/* Towns whose entries cannot be drawn apart at this zoom:
                  one marker carrying the count, which stays true however
                  far out the reader is. Selecting it lists the same
                  entries the pins would have opened. */}
              {view === "entries"
                ? entryClusters.map((c) => {
                    const isSel = selectedTownUid === c.town.uid;
                    // Area grows with the count, so ten reads as more than
                    // three without a town of forty swallowing its
                    // neighbours.
                    // The capped radius, so a marker never covers its neighbour.
                    const r = c.radius * (isSel ? 1.4 : 1);
                    const label = tr.cluster(c.count, c.town.name, c.town.district);
                    return (
                      <g
                        key={`cl-${c.town.uid}`}
                        transform={`translate(${c.ax} ${c.ay}) scale(${k})`}
                        tabIndex={inView(c.ax, c.ay) ? 0 : -1}
                        role="button"
                        aria-label={label}
                        className="group/pin cursor-pointer focus-visible:outline-2 focus-visible:outline-blue"
                        onClick={(e) => {
                          pinOpenerRef.current = e.currentTarget;
                          setOpenCluster({ town: c.town, pins: c.pins });
                          selectTown(c.town);
                        }}
                        onPointerEnter={() => {
                          setHover(label);
                          setHoverUid(c.town.uid);
                        }}
                        onPointerLeave={() => {
                          setHover(null);
                          setHoverUid(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            pinOpenerRef.current = e.currentTarget;
                            setOpenCluster({ town: c.town, pins: c.pins });
                            selectTown(c.town);
                          }
                        }}
                      >
                        <circle r={Math.max(PIN_HIT, r + 2)} fill="transparent" />
                        <circle
                          r={r}
                          fill="#FFFFFF"
                          stroke={isSel ? "#173B63" : UI.outlineQuiet}
                          strokeWidth={PIN_STROKE}
                          className="pointer-events-none"
                        />
                        <text
                          textAnchor="middle"
                          y={r * 0.36}
                          fontSize={r * 1.05}
                          fontWeight={600}
                          fill="#173B63"
                          className="pointer-events-none select-none"
                        >
                          {c.count}
                        </text>
                        <title>{label}</title>
                      </g>
                    );
                  })
                : null}

              {/* Town names sit over their fan, not on any one pin. */}
              {view === "entries"
                ? placePoints.map((p) => {
                    const t = p.town;
                    if (!visibleLabels.towns.has(t.name)) return null;
                    // The label clears whatever the town actually drew:
                    // the fitted fan, or the single marker that replaced
                    // it where the fan would not have been legible.
                    const cluster = clusterByTown.get(t.name);
                    // The anchor is already resolved for any town that
                    // drew something; anchorOf just reads its cache here.
                    const a = anchorOf(t);
                    const reach = cluster
                      ? cluster.radius
                      : fanRadius(p.total, fitSpacing(p.total, a.room / k, PIN_SPACING));
                    return (
                      <text
                        key={`pl-${t.name}`}
                        transform={`translate(${a.x} ${a.y}) scale(${k})`}
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
                    const r = damageRadius(a.destroyed);
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
                        {/* Opaque, because the number sits on it. At 0.75
                            the rust composited to #BC7165 against the land
                            fill and carried its white digits at 3.69:1,
                            under the 4.5:1 that 8.5px text needs; solid it
                            is 5.41:1. Seeing the ground through a badge is
                            worth less than reading the badge. */}
                        <circle r={r} fill={UI.rust} stroke="#FFFFFF" strokeWidth={1.4} />
                        <text
                          y={3.2}
                          fontSize={8.5}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontWeight={700}
                        >
                          {a.destroyed.toLocaleString("en-US")}
                        </text>
                        {/* The badge is always drawn - it carries the
                            count, which is the figure. Its name gives way
                            when it cannot be read clear of a neighbour;
                            the title below still says it either way. */}
                        {visibleLabels.damage.has(a.label) ? (
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
                        ) : null}
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
                        <circle
                          r={DAHIEH_R}
                          fill={UI.rust}
                          fillOpacity={0.55}
                          stroke="#FFFFFF"
                          strokeWidth={1.4}
                        />
                        {visibleLabels.damage.has(DAHIEH_KEY) ? (
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
                        ) : null}
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
              <div
                dir={locale === "ar" ? "rtl" : "ltr"}
                className="pointer-events-none absolute left-2 top-2 max-w-[75%] rounded-sm bg-white/95 px-2 py-1 text-micro font-medium text-text shadow-sm"
              >
                {hover}
              </div>
            ) : null}
            {zoomed ? (
              <button
                type="button"
                aria-label={tr.overviewAria}
                className="absolute right-2 top-2 rounded-sm border border-border bg-white/90 p-0.5 shadow-sm"
                onClick={(e) => {
                  // Enter and Space on a button produce a click with no
                  // pointer behind it, and clientX/clientY are 0 - which
                  // this handler read as "the reader aimed at the very
                  // top-left of the thumbnail" and obediently recentred
                  // on the sea north-west of the country, every single
                  // time. A synthetic click reports detail 0; a real one
                  // reports 1. Whole-country is the sensible reading of
                  // "recentre" when no point was aimed at, and it gives
                  // keyboard readers the zoom-out they otherwise had no
                  // way to reach.
                  if (e.detail === 0) {
                    setVb(HOME);
                    return;
                  }
                  // Measured from the drawing, not from the button around
                  // it. The button carries padding and a border, so
                  // reading the ratio off it put every click a couple of
                  // percent out - and silently more whenever the two
                  // sizes drifted apart.
                  const rect = (miniRef.current ?? e.currentTarget).getBoundingClientRect();
                  const cx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
                  const cy = ((e.clientY - rect.top) / rect.height) * VIEW_H;
                  setVb((cur) => vbAround(cx, cy, cur.w));
                }}
              >
                <svg
                  ref={miniRef}
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  width={MINI_W}
                  height={MINI_H}
                  aria-hidden
                >
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
        {/*
         * One live region, mounted from the start.
         *
         * The two panels below carried aria-live themselves, and both
         * appear only once something is selected - so the region and its
         * text arrived in the same commit, which is an initial render and
         * is silent. Selecting a pin announced nothing at all. This sits
         * here empty and is filled on selection, which is a mutation and
         * does announce; the panels no longer claim to be live regions,
         * so a reader moving from one pin to the next hears it once.
         */}
        {/*
         * What was selected, not what region it falls in.
         *
         * The second branch announced the zone label, and a zone covers
         * many towns - so selecting any of the thirty-odd markers in the
         * south said "South and Nabatieh" and selecting the next one said
         * it again. A live region that repeats itself is one a reader
         * learns to ignore.
         */}
        <p role="status" aria-live="polite" className="sr-only">
          {openPin
            ? `${openPin.title} · ${openPin.townName}${openPin.district ? ` · ${openPin.district}` : ""}`
            : openCluster
              ? `${openCluster.town.name}${openCluster.town.district ? ` · ${openCluster.town.district}` : ""} · ${tr.clusterPanel(openCluster.pins.length)}`
              : selectedTownName
                ? `${selectedTownName}${selectedTownRecords.length ? ` · ${tr.clusterPanel(selectedTownRecords.length)}` : ""}`
                : ""}
        </p>
        {/*
         * What a counted marker stands for.
         *
         * The marker's own name promises a list, and until now selecting
         * it opened the town's bar-chart panel instead - so the entries it
         * covers had no element at all: nothing to focus, nothing to open.
         * Each row here is one of them, and opens the same panel a pin
         * does, so a reader who cannot zoom still reaches every entry.
         */}
        {openCluster && !openPin ? (
          <aside
            className="card border-s-4"
            style={{ borderInlineStartColor: UI.outlineQuiet }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                restoreFocusRef.current = true;
                setOpenCluster(null);
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-micro font-semibold uppercase tracking-wide text-text-secondary">
                  {openCluster.town.name}
                  {openCluster.town.district ? ` · ${openCluster.town.district}` : ""}
                </p>
                <h3
                  ref={clusterHeadingRef}
                  tabIndex={-1}
                  className="mt-1 text-body font-semibold text-navy focus-visible:outline-2 focus-visible:outline-blue"
                >
                  {tr.clusterPanel(openCluster.pins.length)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  restoreFocusRef.current = true;
                  setOpenCluster(null);
                }}
                aria-label={tr.close}
                className="shrink-0 rounded-sm px-1.5 text-text-secondary hover:text-navy"
              >
                ×
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {openCluster.pins.map((pin) => (
                <li key={pin.id}>
                  <button
                    type="button"
                    onClick={() => setOpenPin(pin)}
                    className="flex w-full items-baseline gap-2 rounded-sm px-1 py-1 text-start text-meta hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-blue"
                  >
                    <span
                      aria-hidden
                      className="mt-1 h-2 w-2 shrink-0 rounded-sm"
                      style={{ background: pin.color }}
                    />
                    <span className="min-w-0">
                      <span className="font-semibold text-text">{pin.title}</span>
                      {pin.detail ? (
                        <span className="block text-text-secondary">{pin.detail}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        {/* The opened pin, above everything else: it is what the reader
            just asked for, and one pin is one traced entry. */}
        {openPin ? (
          <aside
            className="card border-s-4"
            style={{ borderInlineStartColor: openPin.color }}
            // Escape closes it from anywhere inside, which is what a
            // reader who just tabbed into it will reach for first.
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                restoreFocusRef.current = true;
                setOpenPin(null);
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-micro font-semibold uppercase tracking-wide text-text-secondary">
                  {openPin.kind === "episode" ? tr.episodeAt : tr.entryAt}{" "}
                  {openPin.townName}
                  {openPin.district ? ` · ${openPin.district}` : ""} · {openPin.year}
                </p>
                {/* tabIndex -1 so focus can be moved here on open
                    without adding a tab stop of its own. */}
                <h3
                  ref={panelHeadingRef}
                  tabIndex={-1}
                  className="mt-1 text-body font-semibold text-navy focus-visible:outline-2 focus-visible:outline-blue"
                >
                  {openPin.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  restoreFocusRef.current = true;
                  setOpenPin(null);
                }}
                aria-label={tr.close}
                className="shrink-0 rounded-sm px-1.5 text-text-secondary hover:text-navy"
              >
                ×
              </button>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-micro font-semibold uppercase tracking-wide">
              <span
                className="rounded-sm px-1.5 py-0.5 text-white"
                style={{ background: chipBackground(openPin.color) }}
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
              <p className="mt-2 text-micro text-text-secondary">
                {openPin.detail}
              </p>
            ) : null}
            <p className="mt-2 whitespace-pre-line text-meta leading-relaxed text-text">
              {openPin.body}
            </p>
            <p className="mt-2.5 border-t border-dashed border-border pt-2 text-micro leading-relaxed text-text-secondary">
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
          <aside className="card">
            <>
              <h3 className="text-body font-semibold text-navy">
                {selectedArea ? `${selectedArea} · ` : ""}
                {regionLabel(selectedZone, locale)} · {year}
              </h3>
              {selectedOccupation === "strip" ? (
                <p className="mt-1.5 rounded-sm bg-[#F7E9E5] px-2 py-1 text-meta font-medium text-rust">
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
                <p className="mt-1.5 rounded-sm bg-[#FBF3EC] px-2 py-1 text-meta text-rust">
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
                  <p className="mt-2 rounded-sm bg-[#F7E9E5] px-2.5 py-2 text-meta leading-relaxed">
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
                  <p className="mt-2 rounded-sm bg-[#F7E9E5] px-2.5 py-2 text-meta leading-relaxed">
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
                <p className="mt-2 rounded-sm bg-[#F4F6F9] px-2.5 py-2 text-meta leading-relaxed">
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
                <div className="mt-2 rounded-sm bg-[#F4F6F9] px-2.5 py-2 text-meta leading-relaxed">
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
                        {/* "activity" does not pluralise with an s. The
                            hover a few lines up already gets this right;
                            this branch was written separately and did
                            not, so every town a reader opened said
                            "traced activitys". */}
                        traced activit{selectedDistrictRecords.length === 1 ? "y" : "ies"} locate
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
                        {/* Bars scale with the counts but print none of
                            them: the groups compare against each other
                            here, and shape alone carries that. The
                            ordering statement below says the same thing
                            for a screen reader. */}
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
                              </div>
                            );
                          })}
                        </div>
                        <p className="sr-only">
                          {tr.groupOrder(
                            layers(locale)
                              .map((l) => ({
                                label: l.label,
                                c: recs.filter((r) => r.actorLayer === l.id).length,
                              }))
                              .filter((x) => x.c > 0)
                              .sort((a, b) => b.c - a.c)
                              .map((x) => x.label)
                              .join(locale === "ar" ? "، " : ", "),
                          )}
                        </p>
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
                              <p className="mt-0.5 text-micro text-text-secondary">
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
              <p className="mt-1 text-meta text-text-secondary">
                {tr.zoneScaleNote}
              </p>
              {/* Group names in weight order, no figures: the zone's
                  groups compare against each other, so the order is the
                  ranking and no count prints. Zero-weight groups are left
                  out - a bare name would read as presence. */}
              <ul className="mt-3 space-y-1.5 text-body">
                {layers(locale)
                  .filter((l) => zoneMentions[l.id] > 0)
                  .sort((a, b) => zoneMentions[b.id] - zoneMentions[a.id])
                  .map((l) => (
                    <li key={l.id} className="flex items-center gap-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                      {l.label}
                    </li>
                  ))}
              </ul>
              <p className="sr-only">
                {tr.groupOrder(
                  layers(locale)
                    .filter((l) => zoneMentions[l.id] > 0)
                    .sort((a, b) => zoneMentions[b.id] - zoneMentions[a.id])
                    .map((l) => l.label)
                    .join(locale === "ar" ? "، " : ", "),
                )}
              </p>
              <p className="mt-3 text-meta text-text-secondary">
                {tr.mentionsCaution}
              </p>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-micro">
                <Link
                  href={locale === "ar" ? "/ar/actors#actor-register" : "/actors#actor-register"}
                  className="font-medium text-blue underline-offset-2 hover:underline"
                >
                  {tr.whoLink}
                </Link>
                <Link
                  href={locale === "ar" ? "/ar/entries" : "/entries"}
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
          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-micro text-text-secondary">
            {/* Colour meaning lives in the key; this row carries the count. */}
            {view === "entries" ? (
              <li>
                {/* Every entry drawn, not only the ones that escaped
                    clustering. At the opening view 27 of the 32 towns are
                    counted markers holding 195 of the 200 entries, and
                    this line used to report the other 5. */}
                {tr.pinCount(
                  entryPins.length + entryClusters.reduce((n, c) => n + c.count, 0),
                  placePoints.length,
                )}
              </li>
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
                  className="flex h-4 w-4 items-center justify-center rounded-full text-micro font-bold text-white"
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
            <p className="mt-1.5 rounded-md border border-border bg-white px-3 py-2 text-micro leading-relaxed text-text-secondary">
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
            <p className="mt-1.5 rounded-md border border-border bg-white px-3 py-2 text-micro leading-relaxed text-text-secondary">
              {locale === "ar" ? (
                <>
                  لم تُقيَّم بحلول 31 آب 2026 سوى منطقتين:{" "}
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
                  Only two zones were assessed by 31 August 2026:{" "}
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
