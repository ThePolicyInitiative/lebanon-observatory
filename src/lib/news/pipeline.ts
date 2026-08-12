import "server-only";
import type { NewsArticle } from "@/lib/types";
import { isLebanonPrimary, normaliseTitle } from "./tagging";

/** Relevance filtering and cross-provider deduplication. */

export function filterRelevant(articles: NewsArticle[], minScore: number): NewsArticle[] {
  return articles.filter((a) => {
    const text = `${a.title} ${a.description ?? ""}`;
    const lebaneseSource =
      a.sourceDomain.endsWith(".lb") || a.sourceDomain === "reliefweb.int";
    // Every provider query already scopes to Lebanon at entry level.
    // The headline-level check guards against passing-reference matches
    // from non-Lebanese outlets; a strong reconstruction score (>= 65,
    // which requires core keywords) is accepted in its place.
    if (!lebaneseSource && !isLebanonPrimary(text) && a.relevanceScore < 65) {
      return false;
    }
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
