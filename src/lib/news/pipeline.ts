import "server-only";
import type { NewsArticle } from "@/lib/types";
import { isLebanonPrimary, namesOtherTheatre, normaliseTitle } from "./tagging";

/** Relevance filtering and cross-provider deduplication. */

/**
 * Publishers whose whole output is Lebanon: the country's own outlets and
 * agencies, plus ReliefWeb's Lebanon feed, which is filtered to the
 * country at the query. Everyone else - Al Jazeera, Arab News, UN News -
 * publishes for the whole region and has to name Lebanon to get in.
 */
function publishesOnlyLebanon(domain: string): boolean {
  return domain.endsWith(".lb") || domain === "reliefweb.int";
}

/**
 * Lebanon has to be the subject, not a mention.
 *
 * Two things used to let other people's wars through. A high
 * reconstruction score stood in for naming Lebanon at all, and
 * "reconstruction" scores the same in Gaza, Kyiv or Khartoum; and a
 * Lebanese domain was trusted outright, so a Beirut paper's Gaza
 * coverage came in with it. Both are gone: every article names Lebanon
 * or a Lebanese place, and a headline about another war is dropped even
 * when a Lebanese outlet wrote it.
 */
export function filterRelevant(articles: NewsArticle[], minScore: number): NewsArticle[] {
  return articles.filter((a) => {
    const text = `${a.title} ${a.description ?? ""}`;

    // The headline is what the story is about. If it names another war
    // and does not name Lebanon, the story is set there.
    if (namesOtherTheatre(a.title) && !isLebanonPrimary(a.title)) return false;

    // Otherwise Lebanon must be named somewhere - unless the publisher
    // only ever writes about Lebanon, where "the southern villages" needs
    // no country attached.
    if (!isLebanonPrimary(text) && !publishesOnlyLebanon(a.sourceDomain)) return false;

    return a.relevanceScore >= minScore;
  });
}

/** Group near-duplicates: canonical URL, then normalised title + domain,
 * then title-token similarity. The best-sourced, earliest article leads. */
export function dedupe(articles: NewsArticle[]): NewsArticle[] {
  const byUrl = new Map<string, NewsArticle>();
  for (const a of articles) {
    const urlKey = a.url.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
    if (!byUrl.has(urlKey)) byUrl.set(urlKey, a);
  }
  const unique = [...byUrl.values()];

  const groups: NewsArticle[][] = [];
  const titleIndex = new Map<string, number>();
  for (const a of unique) {
    const norm = normaliseTitle(a.title);
    const tokens = new Set(norm.split(" ").filter((t) => t.length > 3));
    let placed = false;
    const exact = titleIndex.get(norm);
    if (exact !== undefined) {
      groups[exact].push(a);
      placed = true;
    } else {
      for (let gi = 0; gi < groups.length && !placed; gi++) {
        const leadNorm = normaliseTitle(groups[gi][0].title);
        const leadTokens = new Set(leadNorm.split(" ").filter((t) => t.length > 3));
        if (tokens.size === 0 || leadTokens.size === 0) continue;
        let inter = 0;
        for (const t of tokens) if (leadTokens.has(t)) inter++;
        const sim = inter / Math.min(tokens.size, leadTokens.size);
        if (sim >= 0.8) {
          groups[gi].push(a);
          placed = true;
        }
      }
    }
    if (!placed) {
      titleIndex.set(norm, groups.length);
      groups.push([a]);
    }
  }

  const typeRank: Record<NewsArticle["sourceType"], number> = {
    official: 0,
    multilateral: 1,
    un: 2,
    ngo: 3,
    media: 4,
  };

  return groups.map((group, gi) => {
    const sorted = [...group].sort(
      (a, b) =>
        typeRank[a.sourceType] - typeRank[b.sourceType] ||
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
    );
    const lead = sorted[0];
    return {
      ...lead,
      duplicateGroupId: group.length > 1 ? `dup-${gi}` : null,
      relatedCount: group.length - 1,
    };
  });
}
