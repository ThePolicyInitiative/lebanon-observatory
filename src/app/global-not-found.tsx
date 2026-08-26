import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Sans_Arabic, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans-arabic",
  subsets: ["arabic"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Page not found - الصفحة غير موجودة - Lebanon Reconstruction Observatory",
  description: "The page you requested does not exist. الصفحة المطلوبة غير موجودة.",
};

const EN_LINKS: [string, string][] = [
  ["/", "Home"],
  ["/compare", "2024 vs 2026"],
  ["/actors", "Actor layers"],
  ["/map", "Map"],
  ["/finance", "Finance & delivery"],
  ["/explorer", "Data explorer"],
  ["/search", "Search"],
];

const AR_LINKS: [string, string][] = [
  ["/ar", "الرئيسية"],
  ["/ar/compare", "2024 مقابل 2026"],
  ["/ar/actors", "الجهات الفاعلة"],
  ["/ar/map", "الخريطة"],
  ["/ar/finance", "التمويل والإنجاز"],
  ["/ar/explorer", "المستكشف"],
  ["/ar/search", "البحث"],
];

function SectionLinks({ links }: { links: [string, string][] }) {
  return (
    <ul className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
      {links.map(([href, label]) => (
        <li key={href}>
          <Link
            href={href}
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-white px-4 text-navy hover:border-navy"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The 404 for URLs that match neither half of the site. It bypasses both
 * root layouts, so it carries its own document, styles and fonts, and it
 * offers the way in twice - once per language, at equal weight - because
 * an unmatched URL says nothing about which language the reader came for.
 */
export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${sourceSerif.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-16 sm:px-6">
          <section aria-labelledby="nf-en" className="text-center">
            <h1
              id="nf-en"
              className="text-xl font-bold text-navy"
            >
              Page not found
            </h1>
            <p className="mt-3 text-sm text-text-secondary">
              The page you requested does not exist. The observatory&apos;s main
              sections are linked below.
            </p>
            <SectionLinks links={EN_LINKS} />
          </section>

          <hr
            aria-hidden
            className="mx-auto my-10 max-w-[420px] border-border"
          />

          <section
            lang="ar"
            dir="rtl"
            aria-labelledby="nf-ar"
            className="text-center"
          >
            <h1
              id="nf-ar"
              className="text-xl font-bold text-navy"
            >
              الصفحة غير موجودة
            </h1>
            <p className="mt-3 text-sm leading-loose text-text-secondary">
              الصفحة المطلوبة غير موجودة. أقسام المرصد الرئيسية في الروابط أدناه.
            </p>
            <SectionLinks links={AR_LINKS} />
          </section>
        </main>
      </body>
    </html>
  );
}
