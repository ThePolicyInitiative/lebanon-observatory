import type { Metadata } from "next";
import { localeAlternates } from "@/lib/i18n";
import { ABOUT } from "@/lib/about-content";
import ArabicPageShell from "../ArabicPageShell";
import AboutBody from "@/app/(en)/about/AboutBody";

const t = ABOUT.ar;

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDesc,
  alternates: localeAlternates("/about", "ar"),
};

/**
 * The Arabic identity page mounts the same body module as the English
 * one, in Arabic: the same five sections and the same address, at the
 * same depth, so a reader on either side learns the same things about
 * who is counting and what the count refuses to claim.
 */
export default function Page() {
  return (
    <ArabicPageShell
      title={t.title}
      lede={t.lede}
      point={t.point}
      englishHref="/about"
      figures={t.figures}
    >
      <AboutBody locale="ar" />
    </ArabicPageShell>
  );
}
