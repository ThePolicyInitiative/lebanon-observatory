import { FEED_HEADERS, buildFeed } from "@/app/feed.xml/build";

/**
 * The Arabic Atom feed, at /ar/feed.xml - the same items as /feed.xml, in
 * Arabic, linking to the Arabic pages. Prerendered like its English twin.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildFeed("ar"), { headers: FEED_HEADERS });
}
