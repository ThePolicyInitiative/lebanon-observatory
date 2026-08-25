import {
  OG_ALT,
  OG_ALT_AR,
  OG_CONTENT_TYPE,
  OG_SIZE,
  loadArabicCardFonts,
  renderArabicCard,
  renderObservatoryCard,
} from "@/components/og-card";

/**
 * The Arabic half's own card. The face it needs does not depend on the
 * request, so it is loaded once here at module scope, as the image
 * conventions ask; if it cannot be had, the route keeps serving the
 * English card rather than a page of empty boxes - or a failed build.
 */
const arabicFonts = await loadArabicCardFonts();

export const alt = arabicFonts ? OG_ALT_AR : OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return arabicFonts ? renderArabicCard(arabicFonts) : renderObservatoryCard();
}
