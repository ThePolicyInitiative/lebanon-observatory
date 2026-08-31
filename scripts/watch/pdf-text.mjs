/**
 * Text out of a PDF, with zlib and nothing else.
 *
 * The reports this reads - World Bank Implementation Status and Results
 * Reports - are generated from a template, not scanned, so every glyph is
 * a literal string inside a Flate-compressed content stream. That makes
 * the extraction a stream walk rather than a rendering problem, and keeps
 * a 3MB PDF library out of the dependency tree for one script.
 *
 * What this does NOT do, and why it does not matter here: it drops
 * positioning, so words that a renderer would separate with a gap come
 * out concatenated ("250.00250.000.004.13"). The disbursement table is
 * read by number pattern rather than by column offset for exactly that
 * reason - see `parseIsrDisbursement` in registry.mjs - and any extractor
 * added later must be written the same way. If a source ever ships a
 * scanned or a differently encoded PDF, extraction returns too little
 * text and the caller's length guard rejects it rather than guessing.
 */

import { inflateSync } from "node:zlib";

/** Below this, we did not read the document - we read its furniture. */
const MIN_PLAUSIBLE_CHARS = 500;

export function pdfToText(buffer) {
  const parts = [];
  let cursor = 0;
  let inflated = 0;

  while (true) {
    const start = buffer.indexOf("stream", cursor);
    if (start < 0) break;
    let from = start + 6;
    // The keyword is followed by CRLF or LF, never by the data directly.
    if (buffer[from] === 0x0d) from++;
    if (buffer[from] === 0x0a) from++;
    const end = buffer.indexOf("endstream", from);
    if (end < 0) break;
    cursor = end + 9;

    let data;
    try {
      data = inflateSync(buffer.subarray(from, end));
    } catch {
      // Not Flate, or not a content stream: images, fonts, metadata.
      continue;
    }
    inflated++;
    const content = data.toString("latin1");
    if (!/T[Jj]/.test(content)) continue;
    parts.push(literalStrings(content));
  }

  const text = parts.join("\n").replace(/[ \t]+/g, " ").trim();
  return { text, streams: inflated, ok: text.length >= MIN_PLAUSIBLE_CHARS };
}

/**
 * Every literal string in a content stream, in the order the page draws
 * them. `\(`, `\)` and `\\` are unescaped; octal escapes are dropped
 * rather than decoded, since they carry glyphs outside the Latin range
 * that no extractor here reads.
 */
function literalStrings(content) {
  const out = [];
  const re = /\((?:\\.|[^\\()])*\)/gs;
  let m;
  while ((m = re.exec(content))) {
    out.push(
      m[0]
        .slice(1, -1)
        .replace(/\\([()\\])/g, "$1")
        .replace(/\\[0-7]{1,3}/g, ""),
    );
  }
  return out.join("");
}
