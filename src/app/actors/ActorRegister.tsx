"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LAYER_META, STATUS_LABELS } from "@/lib/colors";
import { roleRecords } from "@/lib/data";
import type { ActorLayer, RoleRecord, Year } from "@/lib/types";

/**
 * The full "who did what" register: every traced actor, expandable
 * to its full list of traced actions - stage by stage, with
 * status, function roles and locations, verbatim from the tracking.
 */

const STATUS_CHIP: Record<string, string> = {
  underway: "bg-[#E8F1EC] text-[#1F6B4E]",
  completed: "bg-[#E8F1EC] text-[#1F6B4E]",
  procurement: "bg-[#E8F1F3] text-[color:var(--color-teal)]",
  financing_committed: "bg-[#E8F1F3] text-[color:var(--color-teal)]",
  financing_disbursed: "bg-[#E8F1F3] text-[color:var(--color-teal)]",
  formal_mandate: "bg-[#EEF2F7] text-[color:var(--color-navy)]",
  announced: "bg-[#FAF3E3] text-[#8a6200]",
  planned: "bg-[#FAF3E3] text-[#8a6200]",
  not_verified: "bg-[#F2F2EF] text-[color:var(--color-text-secondary)]",
};

type ActorGroup = {
  base: string;
  people: string;
  subtype: string;
  layer: ActorLayer;
  records: RoleRecord[];
  y24: number;
  y26: number;
  stages: number;
};

function buildGroups(): ActorGroup[] {
  const byBase = new Map<string, RoleRecord[]>();
  for (const r of roleRecords) {
    const base = r.actorName.split(":")[0].trim();
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base)!.push(r);
  }
  return [...byBase.entries()]
    .map(([base, records]) => {
      const people = records
        .map((r) => r.actorName.split(":").slice(1).join(":").trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0] ?? "";
      return {
        base,
        people,
        subtype: records[0].actorSubtype ?? "",
        layer: records[0].actorLayer,
        records: records.sort((a, b) => a.year - b.year || a.stageNo - b.stageNo),
        y24: records.filter((r) => r.year === 2024).length,
        y26: records.filter((r) => r.year === 2026).length,
        stages: new Set(records.map((r) => r.stageNo)).size,
      };
    })
    .sort((a, b) => b.records.length - a.records.length);
}

const ALL_GROUPS = buildGroups();

const ROLE_FIELDS = [
  ["financingRole", "finance"],
  ["procurementRole", "procurement"],
  ["implementationRole", "implementation"],
  ["oversightRole", "oversight"],
] as const;

export default function ActorRegister() {
  const [query, setQuery] = useState("");
  const [layer, setLayer] = useState<"all" | ActorLayer>("all");
  const [year, setYear] = useState<"both" | Year>("both");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_GROUPS.map((g) => ({
      ...g,
      // The year toggle narrows the entries shown for each actor.
      records: g.records.filter((r) => year === "both" || r.year === year),
    })).filter((g) => {
      if (g.records.length === 0) return false;
      if (layer !== "all" && g.layer !== layer) return false;
      if (!q) return true;
      return (
        g.base.toLowerCase().includes(q) ||
        g.people.toLowerCase().includes(q) ||
        g.subtype.toLowerCase().includes(q) ||
        g.records.some((r) => (r.tracedAction ?? "").toLowerCase().includes(q))
      );
    });
  }, [query, layer, year]);

  const shownRecords = groups.reduce((a, g) => a + g.records.length, 0);

  function toggle(base: string) {
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(base)) next.delete(base);
      else next.add(base);
      return next;
    });
  }

  return (
    <section
      aria-labelledby="actor-register"
      className="card p-4 sm:p-6"
    >
      <h2
        id="actor-register"
        className="text-xl font-semibold text-[color:var(--color-navy)]"
      >
        Who did what - the full register
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        Every traced actor and every traced action, as written in the
        tracking: the stage it belongs to, its status, its function roles and
        where it happened. Traced presence is not performance and a mandate
        is not delivery, so each entry is labelled as exactly what the
        sources support.
      </p>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 sm:max-w-xs">
          <label
            htmlFor="register-search"
            className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]"
          >
            Search actors and actions
          </label>
          <input
            id="register-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. rubble, CDR, compensation, Nabatieh"
            className="mt-1 min-h-11 w-full rounded-md border border-[color:var(--color-border)] bg-white px-2.5 text-sm"
          />
        </div>
        <div role="radiogroup" aria-label="Layer filter" className="flex flex-wrap gap-1.5">
          {[{ id: "all" as const, label: "All layers", color: "#667588" }, ...LAYER_META].map(
            (l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={layer === l.id}
                onClick={() => setLayer(l.id as "all" | ActorLayer)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
                  layer === l.id
                    ? "border-[color:var(--color-navy)] bg-[color:var(--color-navy)] text-white"
                    : "border-[color:var(--color-border)] bg-white text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-navy)]"
                }`}
              >
                <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </button>
            ),
          )}
        </div>
        <div
          role="radiogroup"
          aria-label="Year filter"
          className="inline-flex overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white"
        >
          {(["both", 2024, 2026] as const).map((y) => (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={year === y}
              onClick={() => setYear(y)}
              className={`min-h-9 px-3 text-xs font-medium ${
                year === y
                  ? "bg-[color:var(--color-navy)] text-white"
                  : "text-[color:var(--color-text-secondary)]"
              }`}
            >
              {y === "both" ? "Both years" : y}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-[color:var(--color-text-secondary)]">
        Showing <strong className="text-[color:var(--color-navy)]">{groups.length}</strong>{" "}
        actors with{" "}
        <strong className="text-[color:var(--color-navy)]">{shownRecords}</strong>{" "}
        entries under the current filters.
      </p>

      {/* Register */}
      <ul className="mt-4 divide-y divide-[color:var(--color-border)] border-t border-[color:var(--color-border)]">
        {groups.map((g) => {
          const meta = LAYER_META.find((l) => l.id === g.layer)!;
          const isOpen = open.has(g.base);
          return (
            <li key={g.base}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggle(g.base)}
                className="flex min-h-12 w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-[#F6F8FA]"
              >
                <span
                  aria-hidden
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[color:var(--color-navy)]">
                    {g.base}
                  </span>
                  <span className="block truncate text-[11px] text-[color:var(--color-text-secondary)]">
                    {g.people ? `${g.people} · ` : ""}
                    {g.subtype}
                  </span>
                </span>
                <span className="hidden shrink-0 gap-1.5 text-[11px] tabular-nums sm:flex">
                  {g.y24 > 0 && year !== 2026 ? (
                    <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 font-semibold text-[#58779B]">
                      2024 × {year === "both" ? g.y24 : g.records.length}
                    </span>
                  ) : null}
                  {g.y26 > 0 && year !== 2024 ? (
                    <span className="rounded-sm bg-[#E8F1EC] px-1.5 py-0.5 font-semibold text-[#2F8F6B]">
                      2026 × {year === "both" ? g.y26 : g.records.length}
                    </span>
                  ) : null}
                  <span className="rounded-sm bg-[#F2F2EF] px-1.5 py-0.5 text-[color:var(--color-text-secondary)]">
                    {g.stages} stage{g.stages === 1 ? "" : "s"}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-[color:var(--color-text-secondary)]">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <div className="space-y-3 px-1 pb-4 pl-5">
                  {g.records.map((r) => (
                    <article
                      key={r.id}
                      className="panel-sunken p-3"
                    >
                      <p className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide">
                        <span
                          className={`rounded-sm px-1.5 py-0.5 ${
                            r.year === 2024
                              ? "bg-[#EEF2F7] text-[#58779B]"
                              : "bg-[#E8F1EC] text-[#2F8F6B]"
                          }`}
                        >
                          {r.year}
                        </span>
                        <span className="rounded-sm bg-white px-1.5 py-0.5 text-[color:var(--color-navy)] ring-1 ring-[color:var(--color-border)]">
                          {r.stageNo}. {r.stage}
                        </span>
                        <span
                          className={`rounded-sm px-1.5 py-0.5 ${STATUS_CHIP[r.implementationStatus] ?? "bg-[#F2F2EF] text-[color:var(--color-text-secondary)]"}`}
                        >
                          {STATUS_LABELS[r.implementationStatus] ?? r.implementationStatus}
                        </span>
                        {ROLE_FIELDS.filter(([field]) => r[field]).map(([field, label]) => (
                          <span
                            key={field}
                            className="rounded-sm bg-[#F4EAF0] px-1.5 py-0.5 text-[color:var(--color-magenta)]"
                          >
                            {label}
                          </span>
                        ))}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-[color:var(--color-text)]">
                        {r.tracedAction ?? r.summary}
                      </p>
                      {r.locationNames.length > 0 ? (
                        <p className="mt-2 text-[11px] text-[color:var(--color-text-secondary)]">
                          <span className="font-semibold">Where:</span>{" "}
                          {r.locationNames.join("; ")}{" "}
                          <Link
                            href={`/map?year=${r.year}&layer=${r.actorLayer}&stage=${r.stageNo}`}
                            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
                          >
                            see on the map →
                          </Link>
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {groups.length === 0 ? (
        <p className="mt-4 rounded-md bg-[#F6F8FA] px-3 py-4 text-sm text-[color:var(--color-text-secondary)]">
          No actors match the current filters.
        </p>
      ) : null}
    </section>
  );
}
