import {
  BRAND_LITANI,
  BRAND_SILHOUETTE,
  BRAND_VIEW_H,
  BRAND_VIEW_W,
} from "./brand-paths";

/**
 * The mark, inline: the nine-governorate silhouette with the Litani in
 * amber, on a deep-navy tile. Drawn from the same generated paths as
 * src/app/icon.svg, so the mark in the masthead and the mark in the
 * browser tab are one drawing - see scripts/build-brand-art.mjs.
 */
const SIDE = Math.round(Math.max(BRAND_VIEW_W, BRAND_VIEW_H) * 1.406);
const OX = Math.round((SIDE - BRAND_VIEW_W) / 2);
const OY = Math.round((SIDE - BRAND_VIEW_H) / 2);

export default function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIDE} ${SIDE}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width={SIDE} height={SIDE} rx={Math.round(SIDE * 0.195)} fill="#0e2542" />
      <g transform={`translate(${OX} ${OY})`}>
        <g
          fill="#ffffff"
          fillOpacity={0.93}
          stroke="#ffffff"
          strokeOpacity={0.93}
          strokeWidth={7}
          strokeLinejoin="round"
        >
          {BRAND_SILHOUETTE.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path
          d={BRAND_LITANI}
          fill="none"
          stroke="#d69600"
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
