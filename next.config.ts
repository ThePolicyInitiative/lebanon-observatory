import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * The one external origin a deployer can add. When a MapLibre style URL is
 * configured, the style JSON, its tiles, glyphs and sprite all come from that
 * host, so it has to be named in the policy - otherwise the vector map fails
 * quietly and falls back to the SVG map instead of erroring. An unparseable
 * value is treated as unset rather than crashing the build.
 */
function mapStyleOrigin(): string {
  const url = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (!url) return "";
  try {
    return ` ${new URL(url).origin}`;
  } catch {
    return "";
  }
}

/**
 * Where the vector map gets its letterforms when no style URL is configured.
 * The inline fallback style in LebanonMap declares MapLibre's demo glyph
 * host, and the town-label layer fetches from it at zoom 10.2 and above, so
 * leaving it out of connect-src loses the town names on the default map
 * while everything around them still draws.
 */
const GLYPH_HOST = "https://demotiles.maplibre.org";

/**
 * Content-Security-Policy without nonces, which is the recipe the bundled
 * Next guide endorses for a fully prerendered site: every analytical page
 * ships as static HTML carrying Next's own inline bootstrap and flight
 * scripts, and a per-request nonce would force all of them to render
 * dynamically. So script-src keeps 'unsafe-inline' and everything around it
 * is tightened instead. The JSON-LD block in each root layout is an inert
 * data island that script-src does not govern either way.
 *
 * Two directives are load-bearing for the map and look removable but are not:
 * MapLibre builds its web worker from a Blob URL (worker-src blob:) and
 * decodes raster imagery into blob: images (img-src blob:). Dropping either
 * degrades the pan-and-zoom map to the SVG fallback with no visible error.
 * ECharts' SVG renderer and React's inline style attributes need
 * style-src 'unsafe-inline'.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Development builds evaluate the HMR runtime; production never does.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data:${mapStyleOrigin()}`,
  "font-src 'self'",
  `connect-src 'self' ${GLYPH_HOST}${mapStyleOrigin()}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Everything the pages load is already same-origin or https, so this only
  // ever affects an operator who points the map at an http style URL. Left
  // off in development, where the server is plain http on localhost.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Superseded by frame-ancestors above; kept for browsers that predate it.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Ignored by browsers over plain http, so it is harmless before TLS is in
  // place and correct the moment it is.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/**
 * The runtime JSON under public/ is addressed by meaning, not by content
 * hash: /cells/<cell>.json, /entries/<id>.json and /geo/<layer>.geojson keep
 * the same URLs across deploys while their contents move with the data (a
 * vitest fails whenever they drift out of step with it). Next serves public/
 * as `public, max-age=0` by default, so today every reopened drawer costs at
 * least a revalidation round-trip and no CDN will hold the 835 kB boundary
 * layer at all.
 *
 * The policy below splits the two cases by how fast a change has to become
 * visible. Boundaries are geometry that only moves when the layer itself is
 * replaced, so they get a day. The analytical projections get five minutes -
 * long enough that reopening a cell drawer or an entry panel within a
 * session is instant, short enough that a data release is visible almost
 * immediately after a deploy. stale-while-revalidate then covers the
 * revalidation itself: a reader past the freshness window is served the old
 * copy once while the new one is fetched behind them, so nobody waits, and
 * nobody is more than one visit behind the current analysis.
 */
const PROJECTION_CACHE = "public, max-age=300, stale-while-revalidate=86400";
const BOUNDARY_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  experimental: {
    // The site has two root layouts - English and Arabic - so there is no
    // single layout Next can compose a 404 from. global-not-found.tsx is
    // the documented way to serve one styled page for URLs that match
    // neither half.
    globalNotFound: true,
  },

  // Nothing is gained by announcing the framework and version on every
  // response.
  poweredByHeader: false,

  /**
   * The routes as they were, kept working.
   *
   * The tab bar became the question a reader arrives with rather than the
   * site's own filing, and seven paths moved with it. Anything already
   * published - a link in a report, a bookmark, a search result, the
   * sitemap a crawler fetched last week - points at the old ones, and a
   * URL that has been given out is a promise.
   *
   * Five were renamed. The last two were dissolved rather than renamed,
   * because neither was a question: /map is how /who draws its answer, and
   * /compare was an axis pretending to be a subject - the year is a
   * control, so its verdict panel is a section of the home page. Both land
   * at the top of the page that absorbed them rather than at the section,
   * because a hash in a redirect destination is not something the bundled
   * guide documents and an undocumented Location header is a poor promise
   * to keep a published URL with.
   *
   * Permanent, because these are not coming back: a 308 is what tells a
   * crawler to move its index rather than keep asking. Both language
   * trees, and the anchor and query string survive the move, so a link
   * into a named actor or a filtered view lands where it meant to.
   */
  async redirects() {
    /** Renamed: the page is the same page, so its subpaths came along. */
    const renamed: [string, string][] = [
      ["/actors", "/who"],
      ["/finance", "/money"],
      ["/damage", "/destroyed"],
      ["/news", "/reported"],
      ["/explorer", "/entries"],
    ];
    /**
     * Dissolved: no subpath rule, because there is no subpath to carry.
     * `/compare/:path*` to `//:path*` would be a broken destination, and
     * `/ar/compare/:path*` to `/ar/:path*` would quietly send a stray path
     * to whatever Arabic route happened to share its name.
     */
    const dissolved: [string, string][] = [
      ["/map", "/who"],
      ["/compare", "/"],
    ];
    return [
      ...renamed.flatMap(([from, to]) => [
        { source: from, destination: to, permanent: true },
        { source: `${from}/:path*`, destination: `${to}/:path*`, permanent: true },
        { source: `/ar${from}`, destination: `/ar${to}`, permanent: true },
        { source: `/ar${from}/:path*`, destination: `/ar${to}/:path*`, permanent: true },
      ]),
      ...dissolved.flatMap(([from, to]) => [
        { source: from, destination: to, permanent: true },
        {
          source: `/ar${from}`,
          destination: to === "/" ? "/ar" : `/ar${to}`,
          permanent: true,
        },
      ]),
    ];
  },

  async headers() {
    return [
      // Header rules are checked before the filesystem, so these reach the
      // prerendered HTML, the route handlers and the public/ JSON alike.
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/geo/:path*",
        headers: [{ key: "Cache-Control", value: BOUNDARY_CACHE }],
      },
      {
        source: "/cells/:path*",
        headers: [{ key: "Cache-Control", value: PROJECTION_CACHE }],
      },
      {
        source: "/entries/:path*",
        headers: [{ key: "Cache-Control", value: PROJECTION_CACHE }],
      },
      // Feed autodiscovery at the HTTP level. The in-page <link rel="alternate">
      // belongs in the two root layouts; this reaches the readers and crawlers
      // that check headers, and keeps each language half pointing at its own
      // feed. The Arabic rule comes second so it overrides the general one on
      // /ar paths.
      //
      // The slugs are the routes as they are now. They were the old names
      // for long enough that the header was announcing the feed on seven
      // paths that redirect and on none of the five that exist.
      {
        source: "/:page(who|destroyed|money|reported|entries|methodology)?",
        headers: [
          {
            key: "Link",
            value: '</feed.xml>; rel="alternate"; type="application/atom+xml"',
          },
        ],
      },
      {
        source: "/ar/:page(who|destroyed|money|reported|entries|methodology)?",
        headers: [
          {
            key: "Link",
            value: '</ar/feed.xml>; rel="alternate"; type="application/atom+xml"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
