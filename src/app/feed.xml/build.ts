import timelineJson from "@/data/timeline.json";
import webUpdates from "@/data/web-updates.json";
import { SITE_URL } from "@/lib/i18n";
import type { Locale } from "@/lib/vocab";

/**
 * The observatory's own dated stream, as an Atom feed in each language.
 *
 * Two things go in, both of them written and dated by this site: the
 * milestone chain the finance page charts, and the actions reported in open
 * web coverage that the live-reporting page carries. The live news page is
 * deliberately left out - it aggregates other publishers by machine and each
 * item there already points at whoever wrote it, so syndicating it again
 * would only re-broadcast their headlines under this site's name.
 *
 * Every item keeps the framing it has on the page it came from: the reported
 * updates say they sit outside the tracking and name their publisher, and the
 * milestones say they are part of it.
 */

const T = {
  en: {
    title: "Lebanon Reconstruction Observatory",
    subtitle:
      "Dated updates the observatory keeps itself: the milestone chain charted on the findings page, and the actions reported in open web coverage that the live-reporting page carries. Not a mirror of the live news page.",
    rights:
      "Figures and wording belong to the observatory; quoted coverage belongs to the publisher named on each item.",
    milestone: "Milestone",
    update: "Reported update",
    reportedOn: "Reported:",
    caution: "Caution:",
    publishedBy: "Published by:",
    outside:
      "Outside the tracking - this update enters no count, no matrix and no map.",
    inside: "Part of the milestone chain the observatory tracks.",
  },
  ar: {
    title: "مرصد إعادة إعمار لبنان",
    subtitle:
      "مستجدات مؤرَّخة يكتبها المرصد نفسه: سلسلة المحطات التي ترسمها صفحة التمويل، والأعمال الواردة في تغطية إلكترونية مفتوحة التي تحملها صفحة الجهات الفاعلة. وليست نسخة عن صفحة المستجدات المباشرة.",
    rights:
      "الأرقام والصياغة من المرصد نفسه؛ وما اقتُبس من تغطية يعود إلى الناشر المذكور مع كل مدخل.",
    milestone: "محطة",
    update: "مستجد مرصود",
    reportedOn: "تاريخ الورود:",
    caution: "تنبيه:",
    publishedBy: "الناشر:",
    outside: "خارج التتبّع - لا يدخل هذا المستجد في أي عدّ ولا مصفوفة ولا خريطة.",
    inside: "من سلسلة المحطات التي يتتبّعها المرصد.",
  },
} as const;

/**
 * Where each half of the site lives. Kept out of the copy table above
 * because these are routes, not wording: the Arabic half is the English
 * routes under /ar, and both feeds point at the pages that already carry
 * the items they syndicate - milestones at the finance page, reported
 * updates at the live-reporting page.
 */
function routes(locale: Locale) {
  const prefix = locale === "ar" ? "/ar" : "";
  return {
    home: prefix || "/",
    milestonePage: `${prefix}/findings`,
    updatePage: `${prefix}/reported`,
    feed: `${prefix}/feed.xml`,
  };
}

type Update = (typeof webUpdates.updates)[number];

/**
 * Entries differ in which written fields they carry, so the inferred element
 * type is a union in which some members have no Arabic key at all. This view
 * lets one lookup serve every member, the way the actors page does it.
 */
type Localised = Partial<
  Record<"actorAr" | "actionAr" | "detailAr" | "cautionAr" | "placeAr" | "dateTextAr", string>
>;

type FeedItem = {
  /** Permanent, unique, and stable across rebuilds. */
  id: string;
  title: string;
  summary: string;
  body: string;
  /** Calendar day this item belongs to, YYYY-MM-DD. */
  day: string;
  /** The day the thing itself happened, where the data states one. */
  happened: string | null;
  page: string;
  publisher: string | null;
  category: string;
};

/** Atom wants RFC 3339 timestamps; the data carries plain calendar days. */
function stamp(day: string): string {
  return `${day}T00:00:00Z`;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A short, order-independent key for the reported updates, which carry no id
 * of their own. Hashing the English actor and action means an item keeps its
 * identity when entries are added above it or its date is filled in later -
 * which is what stops a reader's feed from re-announcing the whole backlog.
 */
function hash(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function paragraphs(...parts: (string | null | undefined)[]): string {
  return parts.filter((p) => p && p.trim().length > 0).join("\n\n");
}

function buildItems(locale: Locale): FeedItem[] {
  const t = T[locale];
  const r = routes(locale);
  const ar = locale === "ar";
  /** The Arabic wording where there is one, the English otherwise. */
  const say = (english: string | undefined, arabic: string | undefined) =>
    (ar ? (arabic ?? english) : english) ?? "";

  const milestones: FeedItem[] = timelineJson.map((m) => {
    const label = say(m.label, m.labelAr);
    const detail = say(m.detail, m.detailAr);
    return {
      id: `${SITE_URL}${r.milestonePage}#m-${m.id}`,
      title: label,
      summary: detail || label,
      body: paragraphs(detail, t.inside),
      day: m.date,
      happened: m.date,
      page: `${SITE_URL}${r.milestonePage}`,
      publisher: null,
      category: t.milestone,
    };
  });

  const updates: FeedItem[] = webUpdates.updates.map((u: Update) => {
    const loc = u as Localised;
    const actor = say(u.actor, loc.actorAr);
    const place = say(u.place, loc.placeAr);
    const action = say(u.action, loc.actionAr);
    const detail = say(u.detail, loc.detailAr);
    const caution = say(u.caution, loc.cautionAr);
    const dateText = say(u.dateText ?? undefined, loc.dateTextAr);
    return {
      id: `${SITE_URL}${r.updatePage}#u-${hash(`${u.actor}|${u.action}`)}`,
      title: place ? `${actor} - ${place}` : actor,
      summary: action,
      body: paragraphs(
        action,
        detail,
        // Half of these entries carry no calendar date, only the wording the
        // coverage used. Keeping that wording is the honest alternative to
        // inventing a day for them.
        !u.dateReported && dateText ? `${t.reportedOn} ${dateText}` : null,
        caution ? `${t.caution} ${caution}` : null,
        // The publisher's own masthead, as the actors page prints it.
        `${t.publishedBy} ${u.sourceName}`,
        t.outside,
      ),
      // Undated entries fall back to the day the coverage was gathered,
      // which is the day they entered the site.
      day: u.dateReported ?? webUpdates.gatheredOn,
      happened: u.dateReported,
      page: `${SITE_URL}${r.updatePage}`,
      publisher: u.sourceUrl,
      category: t.update,
    };
  });

  // Newest first. Array.prototype.sort is stable, so items sharing a day keep
  // the order the data puts them in.
  return [...milestones, ...updates].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

function entryXml(item: FeedItem): string {
  const lines = [
    "  <entry>",
    `    <title type="text">${esc(item.title)}</title>`,
    `    <id>${esc(item.id)}</id>`,
    `    <updated>${stamp(item.day)}</updated>`,
    item.happened ? `    <published>${stamp(item.happened)}</published>` : "",
    `    <link rel="alternate" type="text/html" href="${esc(item.page)}"/>`,
    item.publisher
      ? `    <link rel="related" type="text/html" href="${esc(item.publisher)}"/>`
      : "",
    `    <category term="${esc(item.category)}"/>`,
    `    <summary type="text">${esc(item.summary)}</summary>`,
    `    <content type="text">${esc(item.body)}</content>`,
    "  </entry>",
  ];
  return lines.filter(Boolean).join("\n");
}

/** The complete Atom document for one language half of the site. */
export function buildFeed(locale: Locale): string {
  const t = T[locale];
  const r = routes(locale);
  const items = buildItems(locale);
  const self = `${SITE_URL}${r.feed}`;
  // The newest item's day, so the feed's own timestamp moves with the data
  // rather than with the build clock.
  const updated = stamp(items[0]?.day ?? webUpdates.gatheredOn);

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${locale}">`,
    `  <title type="text">${esc(t.title)}</title>`,
    `  <subtitle type="text">${esc(t.subtitle)}</subtitle>`,
    `  <id>${esc(self)}</id>`,
    `  <link rel="self" type="application/atom+xml" href="${esc(self)}"/>`,
    `  <link rel="alternate" type="text/html" href="${esc(`${SITE_URL}${r.home}`)}"/>`,
    `  <updated>${updated}</updated>`,
    `  <author><name>${esc(t.title)}</name></author>`,
    `  <rights type="text">${esc(t.rights)}</rights>`,
    ...items.map(entryXml),
    "</feed>",
    "",
  ].join("\n");
}

/**
 * Content only moves when the site is rebuilt, so both feeds are prerendered
 * and this window is what a reader's client and any CDN in front of it hold
 * between polls. An hour is polite for a stream that changes on the order of
 * days, and stale-while-revalidate keeps a poll from ever waiting on the
 * origin.
 */
export const FEED_HEADERS = {
  "content-type": "application/atom+xml; charset=utf-8",
  "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
};
