import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Source_Serif_4 } from "next/font/google";
import "../globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { CHROME, SITE_URL } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Lebanon Reconstruction Observatory",
    template: "%s - Lebanon Reconstruction Observatory",
  },
  description:
    "Tracking Lebanon's reconstruction: rubble clearance, debris treatment, rebuilding works, shelter and return - who is rebuilding, with what money, at what stage, town by town, 2024-2026.",
  openGraph: {
    title: "Lebanon Reconstruction Observatory",
    description:
      "Tracking Lebanon's reconstruction town by town: rubble, works, finance and return, 2024-2026.",
    type: "website",
    url: SITE_URL,
    siteName: "Lebanon Reconstruction Observatory",
    locale: "en",
    images: [
      {
        url: "/og/og-en.png",
        width: 1200,
        height: 630,
        alt: "Lebanon drawn as its towns, one dot per cadastral shape, with the Litani in amber.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lebanon Reconstruction Observatory",
    description:
      "Tracking Lebanon's reconstruction town by town: rubble, works, finance and return, 2024-2026.",
    images: ["/og/og-en.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#143f35",
};

/**
 * The English half of the site owns its own <html>. The Arabic half owns a
 * separate one under (ar), which is the only way the served markup can say
 * lang="ar" dir="rtl" before any script runs - assistive technology and
 * crawlers both read the document element, not a wrapper inside the body.
 */
/** Binds the two language halves to one entity for search engines. */
const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Lebanon Reconstruction Observatory",
      url: SITE_URL,
      inLanguage: ["en", "ar"],
    },
    {
      "@type": "Organization",
      name: "Lebanon Reconstruction Observatory",
      url: SITE_URL,
    },
  ],
});

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
      // Browser extensions (e.g. QuillBot's data-qb-installed) inject
      // attributes into <html> before React hydrates; ignore attribute
      // mismatches on this element only.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json">{JSON_LD}</script>
        <a href="#main-content" className="skip-link">
          {CHROME.en.skip}
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
