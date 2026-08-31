/**
 * The identity copy: who runs the observatory, what its tracking covers,
 * what it refuses to claim, how to reach it, and how often it moves.
 *
 * It lives here rather than beside the Arabic page copy because both
 * halves of the site read it - the two About pages and the footer strip
 * that carries the same two dates on every page. One home means the
 * currency date and the revision date cannot drift between languages.
 *
 * Deliberately not a method note: no transformation rules, no field
 * definitions, no listing of where the underlying text came from. Scope
 * and limits only.
 */

/**
 * How current the tracking is. The site no longer holds a cut-off that
 * excludes later material: this is the date the tracking reaches, and
 * every figure carries its own date beside it.
 */
export const CONTENT_THROUGH = "2026-08-31";

/**
 * The last content release, and the one place it is written. The crawler
 * date and the reader-facing date are the same fact, so src/app/sitemap.ts
 * derives CONTENT_UPDATED from this constant rather than repeating it - a
 * footer that ages while the sitemap moves is worse than no date at all.
 */
export const ANALYSIS_REVISED = "2026-08-31";

/**
 * The observatory's contact address, or null while there is none.
 *
 * It is null rather than a plausible-looking placeholder on purpose: a
 * site that publishes a live mailto nobody reads is worse than one that
 * says plainly it has no channel open yet. Set it here and it appears on
 * the About page and in the footer, in both languages.
 */
export const CONTACT_EMAIL: string | null = null;

/*
 * The identity page these strings once fed was removed at the user's
 * request on 31 August 2026; what remains here is what the chrome still
 * reads - the footer identity strip, the two dates, and the contact
 * address the footer prints when one exists.
 */
export const ABOUT_FOOTER = {
  en: {
    heading: "The observatory",
    identity:
      "Independent tracking of who rebuilds Lebanon, 2024 and 2026 - compiled outside government, donor and implementing bodies.",
    updatedLabel: "Last updated",
    revised: (d: string) => `Analysis last revised ${d}`,
    note: "Later coverage sits on the live updates page and enters none of these figures.",
  },
  ar: {
    heading: "المرصد",
    identity:
      "تتبّع مستقل لمن يعيد بناء لبنان، 2024 و2026 - يُعَدّ خارج الحكومة والجهات المانحة والجهات المنفّذة.",
    updatedLabel: "آخر تحديث",
    revised: (d: string) => `آخر مراجعة للتحليل ${d}`,
    note: "التغطية اللاحقة تبقى على صفحة المستجدات ولا تدخل في أي من هذه الأرقام.",
  },
} as const;
