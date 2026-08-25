import { FEED_HEADERS, buildFeed } from "./build";

/**
 * The English Atom feed, at /feed.xml. Its Arabic twin lives at
 * /ar/feed.xml and carries the same items in Arabic.
 *
 * Everything it syndicates is baked into the build, so it is prerendered
 * with the rest of the site and costs the server nothing per reader.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildFeed("en"), { headers: FEED_HEADERS });
}
