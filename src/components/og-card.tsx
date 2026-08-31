import { ImageResponse } from "next/og";
import type { CSSProperties } from "react";
import { AIM } from "@/lib/framework";

export const OG_ALT =
  "Lebanon Reconstruction Observatory - tracking rubble, works, finance and return, 2024-2026";
export const OG_ALT_AR =
  "مرصد إعادة إعمار لبنان - تتبّع الأنقاض والأشغال والتمويل والعودة، 2024-2026";
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Social card: the site's own palette, with the figure that defines it.
 *
 * The English card below ships no font of its own and rides the image
 * renderer's built-in Latin face. The Arabic card cannot: it loads an
 * Arabic face first (see loadArabicCardFonts) and only renders if it has
 * one, falling back to this card if it does not.
 */
export function renderObservatoryCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(150deg, #122e50 0%, #173b63 55%, #1c4a7c 100%)",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#D69600",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 8,
                background: "#D69600",
                color: "#173b63",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              LR
            </div>
            Lebanon Reconstruction Observatory
          </div>
          <div
            style={{
              marginTop: 30,
              color: "#ffffff",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1,
              maxWidth: 980,
            }}
          >
            {AIM.en.title}
          </div>
          <div
            style={{
              marginTop: 22,
              color: "rgba(255,255,255,0.82)",
              fontSize: 27,
              lineHeight: 1.4,
              maxWidth: 940,
            }}
          >
            Who is rebuilding Lebanon, with what money, at what stage - town by
            town, 2024 to 2026.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 46,
            borderTop: "1px solid rgba(255,255,255,0.25)",
            paddingTop: 26,
          }}
        >
          {[
            ["US$250M", "approved"],
            ["1.65%", "disbursed"],
            ["0", "works contracts awarded"],
          ].map(([n, label]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: "#ffffff", fontSize: 40, fontWeight: 800 }}>{n}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 21 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

/* ------------------------------------------------------------------ *
 * The Arabic card
 * ------------------------------------------------------------------ */

export type CardFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

const AR_FAMILY = "Plex Arabic";
const LATIN_FAMILY = "Plex Latin";

/**
 * IBM Plex Sans Arabic, the same face the Arabic pages read in, in the
 * two weights this card sets and in the one format the image renderer
 * accepts.
 *
 * Two things force the shape of this function. The renderer takes ttf,
 * otf or woff and not woff2, and the copy on the card mixes Arabic words
 * with Western figures, which live in different slices of the family -
 * so the Arabic slice alone would leave "1.65%" blank. Asking Google for
 * the stylesheet as an old browser returns woff rather than woff2, and
 * the stylesheet names one file per slice per weight.
 *
 * The whole thing runs once, at build time, on a host the build already
 * depends on: the Arabic layout loads this same family through
 * next/font/google. If it fails anyway the caller renders the English
 * card, exactly as before, rather than failing the build.
 */
export async function loadArabicCardFonts(): Promise<CardFont[] | null> {
  const OLD_BROWSER =
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36";
  const wanted: { slice: string; family: string }[] = [
    { slice: "arabic", family: AR_FAMILY },
    { slice: "latin", family: LATIN_FAMILY },
  ];
  try {
    const sheet = await fetch(
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700",
      { headers: { "user-agent": OLD_BROWSER }, signal: AbortSignal.timeout(15000) },
    );
    if (!sheet.ok) return null;
    const css = await sheet.text();

    const faces: { slice: string; weight: number; url: string }[] = [];
    for (const m of css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
      const weight = Number(m[2].match(/font-weight:\s*(\d+)/)?.[1] ?? 0);
      const url = m[2].match(/url\(([^)]+)\)/)?.[1] ?? "";
      if (url.endsWith(".woff")) faces.push({ slice: m[1], weight, url });
    }

    const out: CardFont[] = [];
    for (const { slice, family } of wanted) {
      for (const weight of [400, 700] as const) {
        const face = faces.find((f) => f.slice === slice && f.weight === weight);
        if (!face) return null;
        const res = await fetch(face.url, {
          headers: { "user-agent": OLD_BROWSER },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) return null;
        out.push({
          name: family,
          data: await res.arrayBuffer(),
          weight,
          style: "normal",
        });
      }
    }
    return out.length === 4 ? out : null;
  } catch {
    return null;
  }
}

/**
 * One line of Arabic, laid out right to left.
 *
 * The image renderer shapes Arabic letters correctly - they join - but it
 * then places whole words left to right and ignores `direction: rtl`, so
 * a sentence handed to it as one string comes out with its words in the
 * wrong order. Handing it one box per word inside a row-reverse flex line
 * puts the ordering back where it belongs and still wraps, because the
 * flex line wraps. Word spacing is the gap, not a space character.
 */
function ArabicLine({
  text,
  gap,
  style,
}: {
  text: string;
  gap: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignSelf: "flex-end",
        columnGap: gap,
        ...style,
      }}
    >
      {text.split(" ").map((word, i) => (
        <div key={i} style={{ display: "flex" }}>
          {word}
        </div>
      ))}
    </div>
  );
}

/**
 * The Arabic social card: the same palette, figures and claims as the
 * English one, mirrored, and set in Arabic. The three figures repeat the
 * English card's exactly - approved, disbursed, works contracts awarded -
 * so a shared /ar link cannot preview a different number from a shared
 * /en one.
 */
export function renderArabicCard(fonts: CardFont[]) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(210deg, #122e50 0%, #173b63 55%, #1c4a7c 100%)",
          padding: 64,
          fontFamily: `${AR_FAMILY}, ${LATIN_FAMILY}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {/* No letter-spacing and no uppercasing here: both break
              connected Arabic script, as the pages themselves note. */}
          <div
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 14,
              color: "#D69600",
              fontSize: 27,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 8,
                background: "#D69600",
                color: "#173b63",
                fontSize: 22,
                fontWeight: 700,
                fontFamily: LATIN_FAMILY,
              }}
            >
              LR
            </div>
            <div style={{ display: "flex" }}>مرصد إعادة إعمار لبنان</div>
          </div>
          <ArabicLine
            text={AIM.ar.title}
            gap={10}
            style={{
              marginTop: 28,
              color: "#ffffff",
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.3,
              maxWidth: 1000,
            }}
          />
          <ArabicLine
            text="من يعيد بناء لبنان، بأي تمويل، وفي أي مرحلة - بلدة بلدة، 2024-2026"
            gap={7}
            style={{
              marginTop: 20,
              color: "rgba(255,255,255,0.82)",
              fontSize: 27,
              lineHeight: 1.6,
              maxWidth: 960,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            justifyContent: "flex-start",
            gap: 46,
            borderTop: "1px solid rgba(255,255,255,0.25)",
            paddingTop: 26,
          }}
        >
          {[
            ["250 مليون دولار", "مُقرّ"],
            ["1.65%", "مدفوع"],
            ["0", "عقود أشغال مُرساة"],
          ].map(([n, label]) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}
            >
              <ArabicLine
                text={n}
                gap={8}
                style={{ color: "#ffffff", fontSize: 38, fontWeight: 700 }}
              />
              <ArabicLine
                text={label}
                gap={6}
                style={{ color: "rgba(255,255,255,0.7)", fontSize: 21, marginTop: 2 }}
              />
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
