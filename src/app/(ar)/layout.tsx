import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "../globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { AR, CHROME, SITE_URL, localeAlternates } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

/*
 * No serif here. The Latin serif carries no Arabic glyphs, and since Plex
 * Arabic covers Latin too, it could not even paint the digits and acronyms
 * inside an Arabic heading - so this tree was downloading a face it had no
 * way of showing. globals.css names it nowhere under [dir="rtl"].
 */

/**
 * The Arabic text face. globals.css prepends this variable to the sans
 * stack under [dir="rtl"], which this layout sets on <html>, so the whole
 * Arabic tree reads in it while the Latin tree never loads it.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: AR.meta.title,
    template: `%s - ${AR.meta.title}`,
  },
  description: AR.meta.description,
  alternates: localeAlternates("/", "ar"),
  openGraph: {
    title: AR.meta.title,
    description: AR.meta.description,
    type: "website",
    url: `${SITE_URL}/ar`,
    siteName: AR.meta.title,
    locale: "ar",
  },
  twitter: {
    card: "summary_large_image",
    title: AR.meta.title,
    description: AR.meta.description,
  },
};

/**
 * The Arabic half of the site, with its own <html>. Splitting the two halves
 * into route groups is what lets this element carry lang="ar" dir="rtl" in
 * the served markup: a wrapper inside <body> reaches CSS, but it never
 * reaches a crawler or a screen reader announcing the document's language.
 */
/** The same entity as the English half, named in Arabic for crawlers. */
const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "مرصد إعادة إعمار لبنان",
      alternateName: "Lebanon Reconstruction Observatory",
      url: `${SITE_URL}/ar`,
      inLanguage: ["ar", "en"],
    },
    {
      "@type": "Organization",
      name: "Lebanon Reconstruction Observatory",
      url: SITE_URL,
    },
  ],
});

export default function ArabicRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${inter.variable} ${plexArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json">{JSON_LD}</script>
        <a href="#main-content" className="skip-link">
          {CHROME.ar.skip}
        </a>
        <SiteNav />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
