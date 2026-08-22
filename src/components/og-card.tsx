import { ImageResponse } from "next/og";

export const OG_ALT =
  "Lebanon Reconstruction Observatory - tracking rubble, works, finance and return, 2024-2026";
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Social card: the site's own palette, with the figure that defines it.
 *
 * Both languages share this one card. The image renderer ships only a Latin
 * face, so Arabic set here would come out as empty boxes; the Arabic pages
 * carry their own title and description in the meta tags, which is the text
 * a shared link actually shows.
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
            From Emergency Substitution to Programmed Reconstruction
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
