import { describe, expect, it } from "vitest";
import { parseRss, RSS_FEEDS } from "@/lib/news/rss";
import { articleId } from "@/lib/news/id";

describe("article ids", () => {
  it("stays unique for URLs sharing a long common prefix", () => {
    // Google News URLs differ only deep in the path - a truncated
    // base64 of the URL collided here (regression).
    const a = articleId("rss", "https://news.google.com/rss/articles/CBMi_first");
    const b = articleId("rss", "https://news.google.com/rss/articles/CBMi_second");
    expect(a).not.toBe(b);
    expect(a.startsWith("rss-")).toBe(true);
  });

  it("is deterministic for the same URL", () => {
    const url = "https://news.google.com/rss/articles/CBMi_first";
    expect(articleId("rss", url)).toBe(articleId("rss", url));
  });
});

const GOOGLE_STYLE = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Search results</title>
<item>
  <title>Lebanon publishes rubble tender for the South - Example Times</title>
  <link>https://news.google.com/rss/articles/CBMi_example</link>
  <pubDate>Mon, 10 Aug 2026 08:30:00 GMT</pubDate>
  <description>&lt;a href="https://example.com"&gt;Lebanon publishes rubble tender&lt;/a&gt;</description>
  <source url="https://www.example-times.com">Example Times</source>
</item>
<item>
  <title><![CDATA[Reconstruction financing gap widens]]></title>
  <link>https://news.google.com/rss/articles/CBMi_two</link>
  <pubDate>Sun, 09 Aug 2026 10:00:00 GMT</pubDate>
  <source url="https://reporter.example">The Reporter</source>
</item>
</channel></rss>`;

const PLAIN_STYLE = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
<item>
  <title>Lebanon: Flash Update No. 46</title>
  <link>https://reliefweb.int/report/lebanon/flash-update-46</link>
  <description><![CDATA[<p>Displacement and shelter figures for the reporting period.</p>]]></description>
  <pubDate>Tue, 11 Aug 2026 06:00:00 +0000</pubDate>
</item>
</channel></rss>`;

describe("RSS parsing", () => {
  it("parses Google-style items with source tags and CDATA titles", () => {
    const items = parseRss(GOOGLE_STYLE);
    expect(items).toHaveLength(2);
    expect(items[0].title).toContain("rubble tender");
    expect(items[0].sourceName).toBe("Example Times");
    expect(items[0].sourceUrl).toBe("https://www.example-times.com");
    expect(items[1].title).toBe("Reconstruction financing gap widens");
  });

  it("parses plain feeds and keeps descriptions", () => {
    const items = parseRss(PLAIN_STYLE);
    expect(items).toHaveLength(1);
    expect(items[0].link).toContain("reliefweb.int");
    expect(items[0].description).toContain("Displacement and shelter");
    expect(items[0].pubDate).toContain("2026");
  });

  it("returns nothing for malformed input instead of throwing", () => {
    expect(parseRss("<html>not a feed</html>")).toEqual([]);
    expect(parseRss("")).toEqual([]);
  });
});

describe("feed registry", () => {
  it("registers the three Google feeds plus ReliefWeb and UN News", () => {
    const names = RSS_FEEDS.map((f) => f.name);
    expect(names).toContain("google-news-en");
    expect(names).toContain("google-news-ar");
    expect(names).toContain("google-news-fr");
    expect(names).toContain("reliefweb-rss");
    expect(names).toContain("un-news");
  });

  it("uses HTTPS URLs with encoded queries only", () => {
    for (const f of RSS_FEEDS) {
      expect(f.url.startsWith("https://")).toBe(true);
      expect(f.url).not.toContain(" ");
    }
  });
});
