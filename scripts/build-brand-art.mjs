/**
 * The visual identity, generated from the site's own geography.
 *
 *   node scripts/build-brand-art.mjs          rebuild every asset
 *   node scripts/build-brand-art.mjs --no-raster   skip the PNG step
 *
 * One idea at three scales, and nothing stock anywhere:
 *
 *   public/brand/constellation.svg   the country drawn as its 1,627
 *                                    cadastral town shapes - one dot per
 *                                    centroid, sized by area, with the
 *                                    Litani as a single amber line. The
 *                                    home hero's backdrop.
 *   src/components/brand-paths.ts    the true ADM1 silhouette + Litani,
 *                                    projected once here so the header
 *                                    mark and the favicon cannot drift.
 *   src/app/icon.svg                 the mark: silhouette on a deep-navy
 *                                    tile, Litani in amber.
 *   src/app/favicon.ico              the same mark as a PNG-in-ICO.
 *   src/app/apple-icon.png           180x180 raster of the mark.
 *   public/og/og-en.png, og-ar.png   1200x630 share cards, one per
 *                                    language, set from the layouts'
 *                                    own titles and descriptions.
 *
 * The raster step drives the Playwright Chromium the e2e suite already
 * installs; everything else is plain geometry.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const noRaster = process.argv.includes("--no-raster");

/* ---- projection ------------------------------------------------------ */

const adm3 = read("public/geo/lebanon-adm3.geojson");
const adm1 = read("src/data/lebanon-adm1.json");
const litani = read("src/data/litani.json");

/** Outer ring(s) of a Polygon or MultiPolygon. */
const rings = (geom) =>
  geom.type === "Polygon" ? [geom.coordinates[0]] : geom.coordinates.map((p) => p[0]);

/** Signed-area centroid of one ring, and its absolute area. */
function centroidOf(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a /= 2;
  return a === 0
    ? { x: ring[0][0], y: ring[0][1], area: 0 }
    : { x: cx / (6 * a), y: cy / (6 * a), area: Math.abs(a) };
}

/*
 * Equirectangular with the x-axis scaled by cos(mid-latitude): at
 * Lebanon's extent the distortion against anything fancier is under a
 * dot's width. Fitted from the towns themselves.
 */
const towns = adm3.features.map((f) => {
  const parts = rings(f.geometry).map(centroidOf);
  return parts.reduce((best, p) => (p.area > best.area ? p : best));
});
const lats = towns.map((t) => t.y);
const lons = towns.map((t) => t.x);
const minLat = Math.min(...lats), maxLat = Math.max(...lats);
const minLon = Math.min(...lons), maxLon = Math.max(...lons);
const KX = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));

const VIEW_W = 640, VIEW_H = 840, PAD = 26;
const spanX = (maxLon - minLon) * KX;
const spanY = maxLat - minLat;
const S = Math.min((VIEW_W - 2 * PAD) / spanX, (VIEW_H - 2 * PAD) / spanY);
const px = (lon) => PAD + (lon - minLon) * KX * S + (VIEW_W - 2 * PAD - spanX * S) / 2;
const py = (lat) => PAD + (maxLat - lat) * S + (VIEW_H - 2 * PAD - spanY * S) / 2;
const r1 = (n) => Math.round(n * 10) / 10;

/* ---- the constellation ----------------------------------------------- */

const byArea = [...towns].sort((a, b) => a.area - b.area);
const rankOf = new Map(byArea.map((t, i) => [t, i / (byArea.length - 1)]));

mkdirSync(join(ROOT, "public/brand"), { recursive: true });
mkdirSync(join(ROOT, "public/og"), { recursive: true });

const AMBER = "#d69600";
const dots = towns
  .map((t) => {
    const rank = rankOf.get(t);
    const r = r1(0.7 + 1.5 * Math.sqrt(rank));
    const o = (0.13 + 0.14 * rank).toFixed(2);
    return `<circle cx="${r1(px(t.x))}" cy="${r1(py(t.y))}" r="${r}" opacity="${o}"/>`;
  })
  .join("");

const litaniPath = litani.segments
  .map((seg) =>
    seg.map(([lon, lat], i) => `${i ? "L" : "M"}${r1(px(lon))} ${r1(py(lat))}`).join(""),
  )
  .join("");

writeFileSync(
  join(ROOT, "public/brand/constellation.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}">` +
    `<g fill="#ffffff">${dots}</g>` +
    `<path d="${litaniPath}" fill="none" stroke="${AMBER}" stroke-width="1.7" stroke-linecap="round" opacity="0.85"/>` +
    `</svg>\n`,
);

/* ---- page motifs: the same geography, dressed for light ground ------- */

/*
 * Each main page carries a small aria-hidden drawing of its own subject,
 * from the same data as everything else: the map page the south, the
 * methodology the nine governorate outlines, the findings the whole
 * country, the actors the four group hues as strata, the actions the
 * twelve stages as a sequence. Inks for the limestone ground, not the
 * cedar bands.
 */
const CEDAR = "#143f35";
const LAYER_HUES = ["#173b63", "#177384", "#d69600", "#a34f7c"];

const lightDots = towns
  .map((t) => {
    const rank = rankOf.get(t);
    const r = r1(0.7 + 1.5 * Math.sqrt(rank));
    const o = (0.1 + 0.16 * rank).toFixed(2);
    return `<circle cx="${r1(px(t.x))}" cy="${r1(py(t.y))}" r="${r}" opacity="${o}"/>`;
  })
  .join("");

const lightConstellation = (viewBox) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
  `<g fill="${CEDAR}">${lightDots}</g>` +
  `<path d="${litaniPath}" fill="none" stroke="${AMBER}" stroke-width="2" stroke-linecap="round" opacity="0.9"/>` +
  `</svg>\n`;

writeFileSync(
  join(ROOT, "public/brand/country.svg"),
  lightConstellation(`0 0 ${VIEW_W} ${VIEW_H}`),
);
/* The area the wars reached hardest: from just above the Litani down. */
const southTop = r1(py(33.62));
writeFileSync(
  join(ROOT, "public/brand/south.svg"),
  lightConstellation(`0 ${southTop} ${r1(VIEW_W * 0.62)} ${r1(VIEW_H - southTop)}`),
);

/*
 * ADM1 rings into the same frame, at full resolution. Any thinning here
 * draws visible hairlines across the silhouette: neighbouring
 * governorates share their border vertices exactly, and sampling each
 * ring independently misaligns the shared edge so the seam shows. Full
 * rings coincide, and the stroke on the fill closes the antialiasing.
 */
const silhouettePaths = adm1.features.map((f) =>
  rings(f.geometry)
    .map(
      (ring) =>
        ring.map(([lon, lat], i) => `${i ? "L" : "M"}${r1(px(lon))} ${r1(py(lat))}`).join("") + "Z",
    )
    .join(""),
);

/*
 * The river at full resolution, one M per real segment. Thinning it drew
 * a forked ghost at the bend, and flattening the segments first joined
 * unrelated reaches with stray straight lines.
 */
const litaniMark = litaniPath;

writeFileSync(
  join(ROOT, "src/components/brand-paths.ts"),
  `/**
 * The mark's geometry, projected from the site's own boundary layers by
 * scripts/build-brand-art.mjs. Generated - edit the script, not this.
 *
 * The silhouette is the nine ADM1 shapes painted as one; the line is the
 * Litani. The same paths feed src/app/icon.svg, so the mark in the header
 * and the mark in the browser tab are one drawing.
 */
export const BRAND_VIEW_W = ${VIEW_W};
export const BRAND_VIEW_H = ${VIEW_H};
export const BRAND_SILHOUETTE: string[] = ${JSON.stringify(silhouettePaths)};
export const BRAND_LITANI = ${JSON.stringify(litaniMark)};
`,
);

/** The mark as a standalone SVG tile. */
function markSvg(size) {
  const tile = 1024;
  const inset = 148;
  const s = (tile - 2 * inset) / Math.max(VIEW_W, VIEW_H);
  const tx = (tile - VIEW_W * s) / 2;
  const ty = (tile - VIEW_H * s) / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tile} ${tile}"${size ? ` width="${size}" height="${size}"` : ""}>` +
    `<rect width="${tile}" height="${tile}" rx="200" fill="#0e2f27"/>` +
    `<g transform="translate(${r1(tx)} ${r1(ty)}) scale(${s.toFixed(4)})">` +
    /*
     * Full-opacity paint with the translucency applied once at group
     * level, and a fat under-stroke: the ADM1 layers were simplified
     * shape by shape upstream, so neighbouring borders do not quite
     * coincide and any per-shape transparency lets the sliver gaps
     * read as hairlines across the silhouette.
     */
    `<g opacity="0.95"><g fill="#ffffff" stroke="#ffffff" stroke-width="18" stroke-linejoin="round">${silhouettePaths.map((d) => `<path d="${d}"/>`).join("")}</g>` +
    `<path d="${litaniMark}" fill="none" stroke="${AMBER}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></g>` +
    `</g></svg>`
  );
}

writeFileSync(join(ROOT, "src/app/icon.svg"), markSvg() + "\n");

/* The nine governorates as quiet outlines, for the methodology page. */
writeFileSync(
  join(ROOT, "public/brand/governorates.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}">` +
    `<g fill="none" stroke="${CEDAR}" stroke-width="1.4" stroke-linejoin="round" opacity="0.5">` +
    silhouettePaths.map((d) => `<path d="${d}"/>`).join("") +
    `</g><path d="${litaniPath}" fill="none" stroke="${AMBER}" stroke-width="2" stroke-linecap="round" opacity="0.9"/></svg>\n`,
);

/*
 * The four actor groups as strata, for the actors page: identity hues,
 * equal bands - the groups are never compared by number anywhere, and a
 * motif does not get to start.
 */
writeFileSync(
  join(ROOT, "public/brand/strata.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 176">` +
    LAYER_HUES.map(
      (hue, i) =>
        `<rect x="${12 + i * 12}" y="${16 + i * 40}" width="260" height="18" rx="9" fill="${hue}" opacity="0.85"/>`,
    ).join("") +
    `</svg>\n`,
);

/* The twelve stages as one sequence, for the actions page. */
writeFileSync(
  join(ROOT, "public/brand/stages.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 36">` +
    `<line x1="14" y1="18" x2="466" y2="18" stroke="#c0ccbd" stroke-width="2"/>` +
    Array.from({ length: 12 }, (_, i) => {
      const x = 14 + (i * 452) / 11;
      return `<circle cx="${r1(x)}" cy="18" r="7" fill="${CEDAR}"/>`;
    }).join("") +
    `</svg>\n`,
);

/* ---- the share cards ------------------------------------------------- */

const i18nSource = readFileSync(join(ROOT, "src/lib/i18n.ts"), "utf8");
/** A named string constant out of the i18n source - read, never copied. */
function arabicTitle() {
  const m = i18nSource.match(/meta:\s*\{\s*title:\s*"([^"]+)"/);
  if (!m || !/[؀-ۿ]/.test(m[1]))
    throw new Error("could not read the Arabic site title from src/lib/i18n.ts");
  return m[1];
}

const constellation = readFileSync(join(ROOT, "public/brand/constellation.svg"), "utf8");

function ogHtml({ lang, dir, title, tagline, years }) {
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; position: relative;
         background: linear-gradient(160deg, #103329 0%, #143f35 55%, #1a4f41 100%);
         font-family: ${dir === "rtl" ? "'IBM Plex Sans Arabic'," : ""} Inter, 'Segoe UI', sans-serif;
         display: flex; align-items: center; }
  .art { position: absolute; top: 50%; transform: translateY(-50%); height: 118%;
         ${dir === "rtl" ? "left: -40px;" : "right: -40px;"} opacity: 0.9; }
  .art svg { height: 100%; width: auto; }
  .text { position: relative; padding: 0 84px; max-width: 780px; }
  .years { color: #e8b64c; font-size: 26px; font-weight: 600; letter-spacing: ${dir === "rtl" ? "0" : "0.18em"}; }
  h1 { color: #ffffff; font-size: 67px; line-height: 1.12; font-weight: 700; margin-top: 18px; }
  .rule { width: 84px; height: 4px; background: #d69600; margin-top: 26px; }
  .years bdo { unicode-bidi: bidi-override; direction: ltr; }
  p { color: rgba(255,255,255,0.78); font-size: 28px; line-height: 1.45; margin-top: 24px; }
</style></head><body>
  <div class="art">${constellation}</div>
  <div class="text">
    <div class="years"><bdo dir="ltr">${years}</bdo></div>
    <h1>${title}</h1>
    <div class="rule"></div>
    <p>${tagline}</p>
  </div>
</body></html>`;
}

const CARDS = [
  {
    file: "og-en.png",
    html: ogHtml({
      lang: "en",
      dir: "ltr",
      title: "Lebanon Reconstruction Observatory",
      tagline: "Who is rebuilding Lebanon - traced town by town, 2024 and 2026.",
      years: "2024 · 2026",
    }),
  },
  {
    file: "og-ar.png",
    html: ogHtml({
      lang: "ar",
      dir: "rtl",
      title: arabicTitle(),
      tagline: "من يعيد بناء لبنان - تتبّع بلدة بلدة، 2024 و2026.",
      years: "2024 · 2026",
    }),
  },
];

if (noRaster) {
  console.log("Vector assets rebuilt; PNG step skipped (--no-raster).");
  process.exit(0);
}

const { chromium } = await import("playwright-core");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const card of CARDS) {
    await page.setContent(card.html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(ROOT, "public/og", card.file) });
    console.log(`public/og/${card.file}`);
  }

  /* The mark, rasterised for the two consumers that cannot take SVG. */
  const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await icon.setContent(
    `<!doctype html><style>*{margin:0}body{width:180px;height:180px}</style>${markSvg(180)}`,
  );
  await icon.screenshot({ path: join(ROOT, "src/app/apple-icon.png"), omitBackground: true });
  console.log("src/app/apple-icon.png");

  await icon.setViewportSize({ width: 32, height: 32 });
  await icon.setContent(
    `<!doctype html><style>*{margin:0}body{width:32px;height:32px}</style>${markSvg(32)}`,
  );
  const png32 = await icon.screenshot({ omitBackground: true });

  /*
   * A modern .ico is allowed to carry a PNG whole: 6-byte header, one
   * 16-byte directory entry, then the PNG bytes. This replaces the
   * create-next-app favicon, which was still shipping Next's own logo.
   */
  const dir = Buffer.alloc(22);
  dir.writeUInt16LE(0, 0); // reserved
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(1, 4); // one image
  dir.writeUInt8(32, 6); // width
  dir.writeUInt8(32, 7); // height
  dir.writeUInt8(0, 8); // palette
  dir.writeUInt8(0, 9); // reserved
  dir.writeUInt16LE(1, 10); // planes
  dir.writeUInt16LE(32, 12); // bit depth
  dir.writeUInt32LE(png32.length, 14);
  dir.writeUInt32LE(22, 18); // offset
  writeFileSync(join(ROOT, "src/app/favicon.ico"), Buffer.concat([dir, png32]));
  console.log("src/app/favicon.ico");
} finally {
  await browser.close();
}
