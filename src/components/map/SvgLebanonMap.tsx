"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LAYER_META, STATUS_LABELS } from "@/lib/colors";
import { locations, gazetteer, STAGES } from "@/lib/data-client";
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
  featureCentroid,
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
  eventsByLocality,
  eventsByTown,
  eventsFor,
  EVENT_KIND_META,
  type MapEvent,
} from "@/lib/events";
import { fmtDate } from "@/lib/format";

function EventsList({ events }: { events: MapEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="mt-3 border-t border-dashed border-[color:var(--color-border)] pt-2.5">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
        What happened here
      </h4>
      <ul className="mt-1.5 space-y-2">
        {events.map((e, i) => {
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
    </div>
  );
}

type Props = {
  year: Year;
  regionValues: Record<string, number>;
  maxRegion: number;
  rampColor: string;
  localityRecords: Map<string, SlimRecord[]>;
  /** All entries under the current filters, for district-level shading. */
  records: SlimRecord[];
  /** Entries under the non-year filters, both years (change view). */
  recordsAllYears: SlimRecord[];
  view: MapView;
  onViewChange: (view: MapView) => void;
  note?: string;
};

export type MapView = "entries" | "change" | "survey" | "damage";

const VIEW_OPTIONS: { id: MapView; label: string }[] = [
  { id: "entries", label: "Traced activity" },
  { id: "change", label: "Change 2024 → 2026" },
  { id: "survey", label: "Damage survey 2024" },
  { id: "damage", label: "Damage assessment 2026" },
];

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

/** ViewBox covering a lon/lat rectangle, padded and aspect-corrected. */
function vbFromLonLat(west: number, south: number, east: number, north: number): ViewBox {
  const a = projectPoint(west, north);
  const b = projectPoint(east, south);
  const pad = 8;
  let w = b.x - a.x + 2 * pad;
  let h = b.y - a.y + 2 * pad;
  if (w / h < 1 / ASPECT) w = h / ASPECT;
  else h = w * ASPECT;
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  return clampVb(midX - w / 2, midY - h / 2, w);
}

/** Quick views over the areas the sources show most densely. */
const REGION_VIEWS: { label: string; vb: ViewBox }[] = [
  { label: "South border strip", vb: vbFromLonLat(35.02, 33.04, 35.78, 33.48) },
  { label: "Beirut & southern suburbs", vb: vbFromLonLat(35.4, 33.75, 35.68, 33.96) },
  { label: "Baalbek–Hermel", vb: vbFromLonLat(35.82, 33.72, 36.65, 34.78) },
  { label: "Tripoli & Akkar", vb: vbFromLonLat(35.6, 34.22, 36.55, 34.75) },
];

/** Small teardrop map pin, anchored at its tip (0,0). ~14px tall. */
const PIN_PATH =
  "M0 0 C -3.1 -5.4, -4.7 -7.3, -4.7 -9.8 A 4.7 4.7 0 1 1 4.7 -9.8 C 4.7 -7.3, 3.1 -5.4, 0 0 Z";

/** Annular sector path for donut markers (angles in radians, from 12 o'clock). */
function arcPath(r0: number, r1: number, a0: number, a1: number): string {
  const start = a0 - Math.PI / 2;
  const end = a1 - Math.PI / 2;
  const large = end - start > Math.PI ? 1 : 0;
  const pt = (r: number, a: number) =>
    `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  return `M${pt(r1, start)}A${r1} ${r1} 0 ${large} 1 ${pt(r1, end)}L${pt(r0, end)}A${r0} ${r0} 0 ${large} 0 ${pt(r0, start)}Z`;
}

/**
 * Vector map at town (cadastre) detail: 1,600+ town polygons from the
 * OCHA COD boundary data shaded by their regional grouping's value,
 * with wheel/drag/button zoom and pan, district outlines and labels,
 * city labels, pins for traced localities, diamond markers on
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
  localityRecords,
  records,
  recordsAllYears,
  view,
  onViewChange,
  note,
}: Props) {
  const [towns, setTowns] = useState<Town[] | null>(null);
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
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const [hoverUid, setHoverUid] = useState<string | null>(null);
  const [vb, setVb] = useState<ViewBox>(HOME);

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

  /** Counter-scale factor: multiply screen-constant sizes by this. */
  const k = vb.w / VIEW_W;
  const zoomed = vb.w < VIEW_W - 0.5;

  useEffect(() => {
    let cancelled = false;
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
            uid: `${name}#${i}`,
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
        setTowns(out);

        // Boundaries dissolved from these same polygons, so outlines sit
        // exactly on the areas they enclose.
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
    return () => {
      cancelled = true;
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

  function zoomCenter(factor: number) {
    setVb((cur) => zoomAt(cur, cur.x + cur.w / 2, cur.y + cur.h / 2, factor));
  }

  const townNames = useMemo(
    () =>
      towns
        ? [
            ...new Set(
              towns
                .filter(
                  (t) => t.name && t.name !== "Conflict" && t.name !== "Litige",
                )
                .map((t) => `${t.name} (${t.district})`),
            ),
          ].sort()
        : [],
    [towns],
  );

  function selectTown(t: Town) {
    setSelectedZone(t.zoneId || null);
    setSelectedArea(`${t.name} · ${t.district} district`);
    setSelectedDistrict(t.district);
    setSelectedTownRaw(t.name);
    setSelectedTownUid(t.uid);
    setSelectedOccupation(
      year !== 2026 ? "" : t.strip ? "strip" : t.occupied ? "district" : "",
    );
    setSelectedLocality(null);
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
      if (!t || name === "Conflict") continue;
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
      if (contextCount > 0) mix.push({ color: "#667588", count: contextCount });
      out.push({
        town: t,
        records: recs,
        episodes: eps,
        color: dominant?.color ?? "#667588",
        dominantLabel: dominant?.label ?? "Conflict context",
        total: recs.length + eps.length,
        mix,
      });
    }
    return out.sort((a, b) => b.total - a.total);
  }, [towns, townRecords, year]);

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

  /** Gazetteer pins remain only for places no town point covers. */
  const fallbackPins = useMemo(() => {
    const covered = new Set(placePoints.map((p) => p.town.name));
    return gazetteer.localities.filter((loc) => {
      if (!localityRecords.has(loc.name)) return false;
      if (!locIndex) return true;
      const m = matchLocations(locIndex, [loc.name]);
      return ![...m.towns].some((tn) => covered.has(tn));
    });
  }, [placePoints, localityRecords, locIndex]);

  /** Town fills - memoized so zoom/pan and hover don't re-diff 1,600 paths. */
  const townLayer = useMemo(() => {
    if (!towns) return null;
    return towns.map((t) => {
      const v = regionValues[t.zoneId] ?? 0;
      const zoneT = maxRegion === 0 ? 0 : v / maxRegion;
      const dCount = districtRecords.get(t.district)?.length ?? 0;
      const distT = dCount / maxDistrict;
      const namedCount = townRecords.get(t.name)?.length ?? 0;
      const unnamed = t.name === "Conflict" || t.name === "Litige" || !t.zoneId;
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
        fill = delta >= 0 ? "#2F8F6B" : "#BD5A46";
        opacity = 0.06 + (Math.abs(delta) / change.maxAbs) * 0.72;
        hoverText = `${t.name} · ${t.district} district - activity ${e.y24} → ${e.y26} (${delta >= 0 ? "+" : ""}${delta})`;
      } else if (view === "survey" && !unnamed) {
        const s = SURVEY_BY_DISTRICT.get(t.district);
        fill = "#BD5A46";
        opacity = s ? 0.12 + (s.units / SURVEY_MAX) * 0.75 : 0.05;
        hoverText = s
          ? `${t.name} · ${t.district} district - ${s.units.toLocaleString("en-US")} housing units reported damaged (Dec 2024 municipal survey)${s.completeShare ? `, ${s.completeShare}% completely damaged` : ""}`
          : `${t.name} · ${t.district} district - not among the districts named in the December 2024 municipal survey`;
      } else if (view === "damage" && !unnamed) {
        opacity = 0.1;
        hoverText = `${t.name} · ${t.district} district - select for assessment details`;
      } else {
        opacity = unnamed ? 0.35 : Math.min(0.85, 0.06 + zoneT * 0.18 + distT * 0.52);
        hoverText = `${t.name} · ${t.district} district - ${dCount} traced activit${dCount === 1 ? "y" : "ies"} in this district${namedCount > 0 ? `, ${namedCount} naming this town` : ""}`;
      }
      if (!affected && !unnamed) opacity *= 0.42;
      if (!unnamed && onStrip2026) hoverText += " · Blue Line border strip (occupation)";
      else if (!unnamed && occupied2026) hoverText += " · district contains occupied areas";

      return (
        <path
          key={t.uid}
          d={t.d}
          fill={fill}
          fillOpacity={opacity}
          stroke={isSel ? "#173B63" : "#FFFFFF"}
          strokeWidth={isSel ? 1.8 : 0.3}
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
            {unnamed ? "Unnamed or disputed area (boundary data)" : hoverText}
          </title>
        </path>
      );
    });
    // selectTown is recreated per render but only closes over `year` (a dep).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [towns, regionValues, maxRegion, rampColor, selectedTownUid, year, view, change, districtRecords, townRecords, maxDistrict, maxTown]);

  const zoneMentions = selectedZone
    ? (locations.mentions[String(year) as "2024" | "2026"][
        selectedZone as keyof (typeof locations.mentions)["2024"]
      ] as Record<ActorLayer, number> | undefined)
    : undefined;

  const selectedRecords = selectedLocality ? localityRecords.get(selectedLocality) ?? [] : [];
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
  const localityEvents = eventsFor(
    selectedLocality ? eventsByLocality.get(selectedLocality) : undefined,
    year,
  );

  /** Adaptive scale bar: a round distance that stays 40–150 px on screen. */
  const scaleKm =
    [100, 50, 25, 10, 5, 2, 1].find((km) => (km * PX_PER_KM) / k <= 150) ?? 1;
  const scaleLen = scaleKm * PX_PER_KM;

  return (
    <div>
      {note ? (
        <p className="mb-2 rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-xs text-[color:var(--color-text-secondary)]">
          {note}
        </p>
      ) : null}

      {/* Town search */}
      <div className="mb-3">
        <label htmlFor="town-search" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">
          Find a town ({towns ? townNames.length.toLocaleString("en-US") : "loading"} cadastral towns - selecting zooms to it)
        </label>
        <input
          id="town-search"
          type="search"
          list="town-list"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="e.g. Aaintaroun (Bent Jbeil)"
          disabled={!towns}
          className="mt-1 min-h-11 w-full max-w-md rounded-md border border-[color:var(--color-border)] bg-white px-2.5 text-sm"
        />
        <datalist id="town-list">
          {townNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>

      {/* Map view modes */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs" role="group" aria-label="Map view">
        <span className="font-semibold text-[color:var(--color-text-secondary)]">View:</span>
        {VIEW_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={view === o.id}
            onClick={() => onViewChange(o.id)}
            className={`min-h-8 rounded-md border px-2.5 font-medium ${
              view === o.id
                ? "border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-white"
                : "border-[color:var(--color-border)] bg-white text-[color:var(--color-text-secondary)] hover:bg-[#EEF2F7] hover:text-[color:var(--color-navy)]"
            }`}
          >
            {o.label}
          </button>
        ))}
        {view === "change" ? (
          <span className="text-[color:var(--color-text-secondary)]">
            both years shown; the year toggle applies to pins and episode markers
          </span>
        ) : null}
      </div>

      {/* Zoom controls */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => zoomCenter(1 / 1.6)}
          aria-label="Zoom in"
          className="min-h-8 min-w-8 rounded-md border border-[color:var(--color-border)] bg-white px-2 font-bold text-[color:var(--color-navy)] hover:bg-[#EEF2F7]"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomCenter(1.6)}
          aria-label="Zoom out"
          className="min-h-8 min-w-8 rounded-md border border-[color:var(--color-border)] bg-white px-2 font-bold text-[color:var(--color-navy)] hover:bg-[#EEF2F7]"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setVb(HOME)}
          className={`min-h-8 rounded-md border px-2.5 font-medium ${
            zoomed
              ? "border-[color:var(--color-border)] bg-white text-[color:var(--color-navy)] hover:bg-[#EEF2F7]"
              : "border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-white"
          }`}
        >
          National view
        </button>
        <span className="mx-1 h-4 w-px bg-[color:var(--color-border)]" aria-hidden />
        {REGION_VIEWS.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => setVb(r.vb)}
            className="min-h-8 rounded-md border border-[color:var(--color-border)] bg-white px-2.5 font-medium text-[color:var(--color-text-secondary)] hover:bg-[#EEF2F7] hover:text-[color:var(--color-navy)]"
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto tabular-nums text-[color:var(--color-text-secondary)]">
          ×{(VIEW_W / vb.w).toFixed(1)} zoom
        </span>
      </div>

      {/* The map column is sized to the map itself (its width is capped so
          the 620x860 portrait never grows taller than ~76vh). Sizing the
          track to that cap rather than to a fraction stops the column from
          reserving width the map cannot use, which left the map floating in
          empty page background. The detail panel takes the remainder. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,54vh)_minmax(0,1fr)]">
        <div>
          <div className="relative mx-auto w-full max-w-[54vh] select-none overflow-hidden rounded-lg border-2 border-[#c9d4e0] bg-[#E9EDF2] shadow-[0_2px_16px_rgba(23,59,99,0.10)]">
            <svg
              ref={svgRef}
              viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
              role="group"
              aria-label={`Town-level map of Lebanon shaded by located traced activities for ${year}.${showOccupation ? " Hatched towns form the Blue Line border strip with traced Israeli occupation." : ""} Zoom with the buttons above the map; use the town search box for keyboard access to individual towns.`}
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
                  <line x1="0" y1="0" x2="0" y2="7" stroke="#BD5A46" strokeWidth="2.2" strokeOpacity="0.55" />
                </pattern>
              </defs>

              {townLayer ?? (
                /* Instant server-rendered district base while towns load */
                DISTRICT_PATHS.map((p) => {
                  const v = regionValues[p.zoneId] ?? 0;
                  const t = maxRegion === 0 ? 0 : v / maxRegion;
                  return (
                    <path
                      key={p.name}
                      d={p.d}
                      fill={rampColor}
                      fillOpacity={v === 0 ? 0.08 : 0.2 + t * 0.7}
                      stroke="#FFFFFF"
                      strokeWidth={0.6}
                      strokeOpacity={0.85}
                    >
                      <title>{`${p.name} - ${p.zoneLabel}: ${v} mentions (${year})`}</title>
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
                  stroke="#BD5A46"
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
                    stroke="#263645"
                    strokeWidth={1.6}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                ) : null;
              })()}

              {/* District labels appear once zoomed in */}
              {k <= 0.55
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

              {/* Unified point layer: everything traced, at the town
                  where it happened. Colour = leading actor layer. */}
              {view === "entries"
                ? placePoints.map((p) => {
                    const t = p.town;
                    const isSel = selectedTownName === t.name;
                    const donut = k <= 0.5;
                    const rBase = Math.min(9, 3 + Math.sqrt(p.total) * 1.5);
                    const r = donut ? rBase * 1.7 : rBase;
                    const r0 = r * 0.55;
                    const showLabel = donut
                      ? declutteredLabels.has(t.name)
                      : topPlaceNames.has(t.name);
                    const describe = `${t.name} - ${t.district} district: ${p.records.length} traced activity${p.records.length === 1 ? "" : "s"}, ${p.episodes.length} episode${p.episodes.length === 1 ? "" : "s"} (${year}); leading layer: ${p.dominantLabel}`;
                    let acc = 0;
                    return (
                      <g
                        key={`pp-${t.name}`}
                        transform={`translate(${t.cx} ${t.cy}) scale(${k})`}
                        tabIndex={0}
                        role="button"
                        aria-label={describe}
                        className="cursor-pointer focus-visible:outline-2 focus-visible:outline-[color:var(--color-blue)]"
                        onClick={() => selectTown(t)}
                        onPointerEnter={() => {
                          setHover(describe);
                          setHoverUid(t.name);
                        }}
                        onPointerLeave={() => {
                          setHover(null);
                          setHoverUid(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectTown(t);
                          }
                        }}
                      >
                        {donut ? (
                          <>
                            {p.mix.length === 1 ? (
                              <circle
                                r={(r + r0) / 2}
                                fill="none"
                                stroke={p.mix[0].color}
                                strokeWidth={r - r0}
                              />
                            ) : (
                              p.mix.map((m, mi) => {
                                const a0 = (acc / p.total) * 2 * Math.PI;
                                acc += m.count;
                                const a1 = (acc / p.total) * 2 * Math.PI;
                                return (
                                  <path
                                    key={mi}
                                    d={arcPath(r0, r, a0, a1)}
                                    fill={m.color}
                                  />
                                );
                              })
                            )}
                            <circle r={r0} fill="#FFFFFF" />
                            {r0 >= 3 ? (
                              <text
                                y={r0 * 0.4}
                                fontSize={Math.max(5.5, r0 * 0.95)}
                                textAnchor="middle"
                                fill="#263645"
                                fontWeight={700}
                              >
                                {p.total}
                              </text>
                            ) : null}
                            <circle
                              r={r + 0.6}
                              fill="none"
                              stroke={isSel ? "#173B63" : "#FFFFFF"}
                              strokeWidth={isSel ? 2 : 1}
                            />
                          </>
                        ) : (
                          <>
                            <circle
                              r={r}
                              fill={p.color}
                              fillOpacity={0.88}
                              stroke={isSel ? "#173B63" : "#FFFFFF"}
                              strokeWidth={isSel ? 2 : 1.2}
                            />
                            {p.episodes.length > 0 ? (
                              <circle
                                r={r + 1.8}
                                fill="none"
                                stroke={p.color}
                                strokeOpacity={0.5}
                                strokeWidth={0.9}
                              />
                            ) : null}
                          </>
                        )}
                        {showLabel ? (
                          <text
                            x={r + 3}
                            y={3}
                            fontSize={9.5}
                            fill="#263645"
                            stroke="#FFFFFF"
                            strokeWidth={2.2}
                            paintOrder="stroke"
                            fontWeight={600}
                          >
                            {t.name}
                          </text>
                        ) : null}
                        <title>{describe}</title>
                      </g>
                    );
                  })
                : null}

              {/* Fallback pins: localities no town point covers */}
              {view !== "entries" ? null : fallbackPins
                .map((loc) => {
                  const recs = localityRecords.get(loc.name)!;
                  const { x, y } = projectPoint(loc.lon, loc.lat);
                  const isSel = selectedLocality === loc.name;
                  return (
                    <g
                      key={loc.name}
                      transform={`translate(${x} ${y}) scale(${k})`}
                      tabIndex={0}
                      role="button"
                      aria-label={`${loc.name}: ${recs.length} traced traced activities in ${year}`}
                      className="cursor-pointer focus-visible:outline-2 focus-visible:outline-[color:var(--color-blue)]"
                      onClick={() => {
                        setSelectedLocality(loc.name);
                        setSelectedZone(null);
                        setSelectedArea(null);
                        setSelectedDistrict(null);
                        setSelectedTownRaw(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedLocality(loc.name);
                          setSelectedZone(null);
                          setSelectedArea(null);
                          setSelectedDistrict(null);
                          setSelectedTownRaw(null);
                        }
                      }}
                    >
                      <path
                        d={PIN_PATH}
                        fill={isSel ? "#D69600" : "#173B63"}
                        stroke="#FFFFFF"
                        strokeWidth={1.1}
                      />
                      <circle cx={0} cy={-9.8} r={1.7} fill="#FFFFFF" />
                      {k <= 0.45 ? (
                        <text
                          x={6}
                          y={0}
                          fontSize={9.5}
                          fill="#173B63"
                          stroke="#FFFFFF"
                          strokeWidth={2.2}
                          paintOrder="stroke"
                          fontWeight={600}
                        >
                          {loc.name}
                        </text>
                      ) : null}
                      <title>{`${loc.name}: ${recs.length} entries`}</title>
                    </g>
                  );
                })}

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
                        aria-label={`${a.label}: ${a.destroyed.toLocaleString("en-US")} buildings completely destroyed in the 2026 assessment`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectTown(a.town);
                          }
                        }}
                      >
                        <circle r={r} fill="#BD5A46" fillOpacity={0.75} stroke="#FFFFFF" strokeWidth={1.4} />
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
                        <title>{`${a.label}: ${a.destroyed.toLocaleString("en-US")} buildings completely destroyed - South of the Litani assessment, 29 April 2026 imagery, desk-validated`}</title>
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
                        <circle r={9} fill="#BD5A46" fillOpacity={0.55} stroke="#FFFFFF" strokeWidth={1.4} />
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
                          Dahieh belt: 93% of Beirut–ML debris
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
                  {scaleKm} km
                </text>
              </g>
            </svg>
            {hover ? (
              <div className="pointer-events-none absolute left-2 top-2 max-w-[75%] rounded-sm bg-white/95 px-2 py-1 text-[11px] font-medium text-[color:var(--color-text)] shadow-sm">
                {hover}
              </div>
            ) : null}
            {zoomed ? (
              <button
                type="button"
                aria-label="Overview map - click to recentre the view"
                className="absolute right-2 top-2 rounded-sm border border-[color:var(--color-border)] bg-white/90 p-0.5 shadow-sm"
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
            <div className="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[10px] text-[color:var(--color-text-secondary)]">
              Towns: OCHA COD (CC BY-IGO) · Governorates: geoBoundaries · River: © OpenStreetMap contributors
            </div>
          </div>

          {/* Map legend */}
          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[color:var(--color-text-secondary)]">
            {view === "entries" ? (
              <>
                <li className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5" aria-hidden>
                    {[0.15, 0.4, 0.65, 0.9].map((o) => (
                      <span key={o} className="h-2.5 w-4" style={{ background: rampColor, opacity: o }} />
                    ))}
                  </span>
                  fewer → more located traced activities (district tint, 0–{maxDistrict})
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5" aria-hidden>
                    {LAYER_META.map((l) => (
                      <span key={l.id} className="h-2.5 w-2.5 rounded-full border border-white" style={{ background: l.color }} />
                    ))}
                  </span>
                  marker at the town where it happened - colour = leading actor
                  layer, size = entries + episodes ({placePoints.length} places);
                  from ×2 zoom markers become layer-mix donuts with the total
                  in the centre
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full border border-white" style={{ background: "#667588" }} />
                  conflict-context episodes only
                </li>
                {fallbackPins.length > 0 ? (
                  <li className="flex items-center gap-1.5">
                    <svg width="10" height="14" viewBox="-6 -16 12 17" aria-hidden>
                      <path d={PIN_PATH} fill="#173B63" stroke="#FFFFFF" strokeWidth="1" />
                    </svg>
                    locality pin (approximate position)
                  </li>
                ) : null}
              </>
            ) : view === "change" ? (
              <>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-4" style={{ background: "#2F8F6B", opacity: 0.7 }} />
                  more located entries in 2026 than 2024
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-4" style={{ background: "#BD5A46", opacity: 0.7 }} />
                  fewer than 2024 - darker = larger change (max ±{change.maxAbs})
                </li>
              </>
            ) : view === "survey" ? (
              <li className="flex items-center gap-1.5">
                <span className="flex items-center gap-0.5" aria-hidden>
                  {[0.15, 0.4, 0.65, 0.9].map((o) => (
                    <span key={o} className="h-2.5 w-4" style={{ background: "#BD5A46", opacity: o }} />
                  ))}
                </span>
                housing units reported damaged by municipalities, December 2024
                (0-{SURVEY_MAX.toLocaleString("en-US")} per district)
              </li>
            ) : (
              <li className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ background: "#BD5A46" }}
                >
                  n
                </span>
                buildings completely destroyed, worst cadasters (2026 assessment)
              </li>
            )}
            {showOccupation ? (
              <>
                <li className="flex items-center gap-1.5">
                  <svg width="16" height="12" aria-hidden>
                    <rect width="16" height="12" fill="url(#occupied-hatch)" stroke="#BD5A46" strokeOpacity="0.7" />
                  </svg>
                  Blue Line border-strip towns - traced occupation (2026)
                </li>
                <li className="flex items-center gap-1.5">
                  <svg width="16" height="12" aria-hidden>
                    <rect
                      x="1"
                      y="1"
                      width="14"
                      height="10"
                      fill="none"
                      stroke="#BD5A46"
                      strokeOpacity="0.65"
                      strokeDasharray="3 2"
                    />
                  </svg>
                  districts containing the strip
                </li>
              </>
            ) : null}
          </ul>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
            Scroll, drag or use the buttons to zoom and pan; district names
            appear from ×1.8 zoom, pin and marker labels from ×2.2.
            {view === "entries"
              ? " Every marker sits at the actual town where the entry or episode is traced (place-name matching across transliteration variants, anchored at the town polygon's centroid). Entries naming only a district shade the backdrop; entries citing only a region stay in the zone totals shown in the panel. Counts measure traced presence, not performance."
              : view === "change"
                ? " Colour compares located traced activities per district between the two years under the current layer, stage and status filters. A rise means more traced presence in the tracking - not more delivery, spending or coverage."
                : view === "survey"
                  ? " Colour is the number of housing units municipalities themselves reported damaged in the December 2024 survey - the fastest national damage assessments the response produced, gathered in ten days on local knowledge."
                  : null}
          </p>
          {view === "survey" ? (
            <p className="mt-1.5 rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
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
            </p>
          ) : null}
          {view === "damage" ? (
            <p className="mt-1.5 rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
              Only two zones were assessed by the 31 July 2026 cut-off:{" "}
              <strong className="text-[color:var(--color-navy)]">South of the Litani</strong>{" "}
              ({destruction.zones2026[0].assessedDamage}; 11,095 buildings
              completely destroyed; desk-validated GeoAI, no field
              verification) and{" "}
              <strong className="text-[color:var(--color-navy)]">Beirut &amp; Mount Lebanon</strong>{" "}
              ({destruction.zones2026[1].assessedDamage}; field-verified). The
              two products differ in method and must not be compared or
              summed. Assessed geography is not damaged geography: the
              real-time national database traced heavy strikes nationwide,
              and the Bekaa, Baalbek-Hermel and the North had no equivalent
              assessment.
            </p>
          ) : null}
          {showOccupation ? (
            <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
              Occupation marking is indicative: the sources show occupied
              border villages and an expanded occupation zone demarcated on 18
              June 2026, but publishes no precise boundary geometry. Hatching
              therefore marks the strip of towns whose land reaches the Blue
              Line (derived from the boundary data, including those behind
              the disputed Ghajar–Shebaa and Metula-adjacent slivers) - the
              closest honest shape to the traced occupation, not its exact
              extent.
            </p>
          ) : null}
        </div>

        {/* Detail panel */}
        <aside
          aria-live="polite"
          className="card p-4 lg:self-start"
        >
          {selectedZone && zoneMentions ? (
            <>
              <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                {selectedArea ? `${selectedArea} · ` : ""}
                {locations.regions.find((r) => r.id === selectedZone)?.label} · {year}
              </h3>
              {selectedOccupation === "strip" ? (
                <p className="mt-1.5 rounded-sm bg-[#F7E9E5] px-2 py-1 text-xs font-medium text-[color:var(--color-rust)]">
                  On the Blue Line border strip, where the sources show
                  occupied villages and the zone demarcated on 18 June 2026;
                  residents of occupied villages cannot return.
                </p>
              ) : selectedOccupation === "district" ? (
                <p className="mt-1.5 rounded-sm bg-[#FBF3EC] px-2 py-1 text-xs text-[color:var(--color-rust)]">
                  In a district whose border strip contains Israeli-occupied
                  areas (2026); this town itself is not on the strip.
                </p>
              ) : null}
              {(() => {
                const anchor = damageAnchors.find((a) => a.town.name === selectedTownRaw);
                return anchor ? (
                  <p className="mt-2 rounded-sm bg-[#F7E9E5] px-2.5 py-2 text-xs leading-relaxed">
                    <strong className="text-[color:var(--color-rust)]">
                      {anchor.destroyed.toLocaleString("en-US")} buildings completely
                      destroyed
                    </strong>{" "}
                    here in the 29 April 2026 South-of-the-Litani assessment (GeoAI
                    against an October 2025 baseline, desk-validated, no field
                    verification) - among the four worst cadasters nationally.
                  </p>
                ) : null;
              })()}
              {(() => {
                const s = selectedDistrict
                  ? SURVEY_BY_DISTRICT.get(selectedDistrict)
                  : undefined;
                return s ? (
                  <p className="mt-2 rounded-sm bg-[#F7E9E5] px-2.5 py-2 text-xs leading-relaxed">
                    <strong className="text-[color:var(--color-rust)]">
                      {s.units.toLocaleString("en-US")} housing units
                    </strong>{" "}
                    reported damaged in {s.name} in the December 2024 municipal
                    survey
                    {s.completeShare ? `, ${s.completeShare}% of them completely damaged` : ""}
                    . Municipal declaration collected in ten days, not an
                    engineering assessment.
                  </p>
                ) : null;
              })()}
              {view === "change" && selectedDistrict ? (
                <p className="mt-2 rounded-sm bg-[#F4F6F9] px-2.5 py-2 text-xs leading-relaxed">
                  Located entries in {selectedDistrict} district:{" "}
                  <strong className="text-[color:var(--color-navy)]">
                    {(change.byDistrict.get(selectedDistrict)?.y24 ?? 0).toLocaleString("en-US")}
                  </strong>{" "}
                  in 2024 →{" "}
                  <strong className="text-[color:var(--color-navy)]">
                    {(change.byDistrict.get(selectedDistrict)?.y26 ?? 0).toLocaleString("en-US")}
                  </strong>{" "}
                  in 2026 under the current filters.
                </p>
              ) : null}
              {selectedDistrict ? (
                <div className="mt-2 rounded-sm bg-[#F4F6F9] px-2.5 py-2 text-xs leading-relaxed">
                  <p>
                    <span className="font-semibold text-[color:var(--color-navy)]">
                      {selectedDistrictRecords.length}
                    </span>{" "}
                    traced activity{selectedDistrictRecords.length === 1 ? "" : "s"} locate
                    work in {selectedDistrict} district under the current filters
                    {selectedTownRecords.length > 0 ? (
                      <>
                        {" "}-{" "}
                        <span className="font-semibold text-[color:var(--color-navy)]">
                          {selectedTownRecords.length}
                        </span>{" "}
                        name{selectedTownRecords.length === 1 ? "s" : ""} {selectedTownName}{" "}
                        directly
                      </>
                    ) : null}
                    .
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
                          {LAYER_META.map((l) => {
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
                                    title={`${i + 1}. ${STAGES[i]}: ${c} entry${c === 1 ? "" : "s"}`}
                                    className="w-3.5 rounded-t-[2px]"
                                    style={{
                                      height: `${4 + (c / maxStage) * 26}px`,
                                      background: c > 0 ? "#58779B" : "#E3E9EF",
                                    }}
                                  />
                                ))}
                              </div>
                              <p className="mt-0.5 text-[10px] text-[color:var(--color-text-secondary)]">
                                value-chain stages 1–12 (hover for names) -{" "}
                                {stageCounts.filter((c) => c > 0).length} of 12 present
                              </p>
                              <p className="sr-only">
                                {stageCounts
                                  .map((c, i) => `${STAGES[i]}: ${c}`)
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
              <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                Mention counts are traced at the regional-grouping level;
                town boundaries are shown for geographic orientation.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {LAYER_META.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                      {l.label}
                    </span>
                    <span className="tabular-nums font-semibold">{zoneMentions[l.id]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[color:var(--color-text-secondary)]">
                Mentions in the tracking - not damage severity, expenditure
                or coverage.
              </p>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <Link
                  href="/actors#actor-register"
                  className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
                >
                  Who did what here →
                </Link>
                <Link
                  href="/explorer"
                  className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
                >
                  Open the data explorer →
                </Link>
              </p>
              <EventsList events={townEvents} />
            </>
          ) : selectedLocality ? (
            <>
              <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                {selectedLocality} · {year}
              </h3>
              <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                {selectedRecords.length} traced activities under the
                current filters. Pin position approximate.
              </p>
              <ul className="mt-2 space-y-1 text-[13px]">
                {[...new Set(selectedRecords.map((r) => r.actorName.split(":")[0]))]
                  .slice(0, 8)
                  .map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
              </ul>
              <p className="mt-2 text-xs text-[color:var(--color-text-secondary)]">
                Stages: {[...new Set(selectedRecords.map((r) => r.stage))].slice(0, 4).join("; ")}
                <br />
                Status: {[...new Set(selectedRecords.map((r) => STATUS_LABELS[r.implementationStatus]))].join("; ")}
              </p>
              <EventsList events={localityEvents} />
            </>
          ) : (
            /* Nothing selected yet: rank the districts rather than leave
               the panel blank beside the map. */
            <>
              <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                {view === "change"
                  ? "Change by district, 2024 → 2026"
                  : `Where activity concentrated, ${year}`}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                {view === "change"
                  ? "Districts ranked by the size of the shift, under the current filters. Select a town on the map for its own breakdown."
                  : "Districts ranked by located traced activity, under the current filters. Select a town on the map for its own breakdown."}
              </p>
              {view === "change"
                ? (() => {
                    const rows = [...change.byDistrict.entries()]
                      .map(([d, e]) => ({ d, ...e, delta: e.y26 - e.y24 }))
                      .filter((r) => r.delta !== 0)
                      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
                    if (rows.length === 0) return null;
                    return (
                      <ul className="mt-3 space-y-1.5 text-[12px]">
                        {rows.map((r) => (
                          <li key={r.d} className="flex items-center gap-2">
                            <span className="w-28 shrink-0 truncate">{r.d}</span>
                            <span className="w-14 shrink-0 tabular-nums text-[11px] text-[color:var(--color-text-secondary)]">
                              {r.y24} → {r.y26}
                            </span>
                            <span
                              aria-hidden
                              className="h-2 rounded-sm"
                              style={{
                                width: `${Math.max(4, (Math.abs(r.delta) / change.maxAbs) * 45)}%`,
                                background: r.delta > 0 ? "#2F8F6B" : "#B4543F",
                              }}
                            />
                            <span
                              className={`tabular-nums font-semibold ${r.delta > 0 ? "text-[#1F6B4E]" : "text-[color:var(--color-rust)]"}`}
                            >
                              {r.delta > 0 ? "+" : ""}
                              {r.delta}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()
                : (() => {
                    const rows = [...districtRecords.entries()]
                      .map(([d, rs]) => ({ d, n: rs.length }))
                      .sort((a, b) => b.n - a.n);
                    if (rows.length === 0) return null;
                    return (
                      <ul className="mt-3 space-y-1.5 text-[12px]">
                        {rows.map((r) => (
                          <li key={r.d} className="flex items-center gap-2">
                            <span className="w-28 shrink-0 truncate">{r.d}</span>
                            <span
                              aria-hidden
                              className="h-2 rounded-sm"
                              style={{
                                width: `${Math.max(4, (r.n / maxDistrict) * 55)}%`,
                                background: rampColor,
                                opacity: 0.75,
                              }}
                            />
                            <span className="tabular-nums font-semibold">{r.n}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
              <p className="mt-3 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                Counts are located traced activity - not damage severity,
                expenditure or coverage.
              </p>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <Link
                  href="/actors#actor-register"
                  className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
                >
                  Who did what →
                </Link>
                <Link
                  href="/explorer"
                  className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
                >
                  Open the explorer →
                </Link>
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
