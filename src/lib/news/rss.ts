import "server-only";
import type { NewsArticle } from "@/lib/types";
import { fetchWithRetry } from "./http";
import { articleId } from "./id";
import {
  classifySourceType,
  detectLanguage,
  sanitizeText,
  safeUrl,
  scoreRelevance,
  tagArticle,
} from "./tagging";

/**
 * Keyless RSS providers: Google News (English, Arabic, French),
 * ReliefWeb's Lebanon updates feed and UN News. RSS needs no
 * registration, so these run everywhere and broaden coverage well
 * beyond the JSON APIs. All parsing is defensive; every string is
 * sanitized before use.
 */

export type RssItem = {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
};

function firstTag(block: string, tag: string): string | null {
  const m = block.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i"),
  );
  return m ? m[1].trim() : null;
}

export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = firstTag(block, "title");
    const link = firstTag(block, "link");
    if (!title || !link) continue;
    const srcMatch = block.match(
      /<source[^>]*url="([^"]*)"[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i,
    );
    items.push({
      title,
      link,
      pubDate: firstTag(block, "pubDate"),
      description: firstTag(block, "description"),
      sourceName: srcMatch ? srcMatch[2].trim() : null,
      sourceUrl: srcMatch ? srcMatch[1] : null,
    });
  }
  return items;
}

function toIso(pubDate: string | null): string {
  if (!pubDate) return new Date().toISOString();
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

type FeedSpec = {
  name: string;
  url: string;
  language: "en" | "ar" | "fr" | null;
  /** Fixed publisher identity for single-org feeds. */
  fixed?: { sourceName: string; sourceDomain: string };
  /** Google News feeds: publisher comes from the <source> tag and the
   * description is a link farm, so it is dropped. */
  googleStyle?: boolean;
};

export const RSS_FEEDS: FeedSpec[] = [
  {
    name: "google-news-en",
    url: "https://news.google.com/rss/search?q=" +
      encodeURIComponent(
        'Lebanon (reconstruction OR rebuilding OR rubble OR debris OR "damage assessment" OR compensation OR shelter OR displaced OR municipalities) when:30d',
      ) +
      "&hl=en-US&gl=US&ceid=US:en",
    language: "en",
    googleStyle: true,
  },
  {
    name: "google-news-ar",
    url: "https://news.google.com/rss/search?q=" +
      encodeURIComponent("لبنان (إعمار OR الأنقاض OR الركام OR تعويضات OR إيواء OR النازحين) when:30d") +
      "&hl=ar&gl=LB&ceid=LB:ar",
    language: "ar",
    googleStyle: true,
  },
  {
    name: "google-news-fr",
    url: "https://news.google.com/rss/search?q=" +
      encodeURIComponent("Liban (reconstruction OR décombres OR indemnisation OR déplacés OR abris) when:30d") +
      "&hl=fr&gl=FR&ceid=FR:fr",
    language: "fr",
    googleStyle: true,
  },
  {
    name: "reliefweb-rss",
    url: "https://reliefweb.int/updates/rss.xml?advanced-search=%28PC141%29",
    language: null,
    fixed: { sourceName: "ReliefWeb", sourceDomain: "reliefweb.int" },
  },
  {
    name: "un-news",
    url: "https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml",
    language: "en",
    fixed: { sourceName: "UN News", sourceDomain: "news.un.org" },
  },
];

export async function fetchRssFeed(spec: FeedSpec): Promise<NewsArticle[]> {
  const res = await fetchWithRetry(spec.url);
  if (!res.ok) throw new Error(`${spec.name} HTTP ${res.status}`);
  const xml = await res.text();
  const items = parseRss(xml);
  const out: NewsArticle[] = [];
  for (const item of items) {
    const url = safeUrl(item.link);
    let title = sanitizeText(item.title, 240);
    if (!url || !title) continue;

    let sourceName: string;
    let sourceDomain: string;
    if (spec.fixed) {
      sourceName = spec.fixed.sourceName;
      sourceDomain = spec.fixed.sourceDomain;
    } else if (item.sourceName) {
      sourceName = sanitizeText(item.sourceName, 100);
      sourceDomain = (() => {
        const u = safeUrl(item.sourceUrl);
        try {
          return u ? new URL(u).hostname.replace(/^www\./, "") : new URL(url).hostname;
        } catch {
          return new URL(url).hostname;
        }
      })();
      // Google News titles end with " - Publisher"; drop the duplicate.
      if (title.endsWith(` - ${sourceName}`)) {
        title = title.slice(0, -(sourceName.length + 3)).trim();
      }
    } else {
      sourceDomain = new URL(url).hostname.replace(/^www\./, "");
      sourceName = sourceDomain;
    }

    const description = spec.googleStyle
      ? null
      : sanitizeText(item.description, 300) || null;
    const text = `${title} ${description ?? ""}`;
    const tags = tagArticle(text);
    out.push({
      id: articleId("rss", url),
      title,
      description,
      sourceName,
      sourceDomain,
      sourceType: spec.fixed
        ? classifySourceType(spec.fixed.sourceDomain)
        : classifySourceType(sourceDomain),
      url,
      imageUrl: null,
      publishedAt: toIso(item.pubDate),
      language: spec.language ?? detectLanguage(null, text),
      provider: "rss",
      ...tags,
      relevanceScore: scoreRelevance(text),
      duplicateGroupId: null,
    });
  }
  return out;
}
