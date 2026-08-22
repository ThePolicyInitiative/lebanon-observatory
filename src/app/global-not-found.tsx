import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Page not found - Lebanon Reconstruction Observatory",
  description: "The page you requested does not exist.",
};

/**
 * The 404 for URLs that match neither half of the site. It bypasses both
 * root layouts, so it carries its own document, styles and fonts, and it
 * offers the way in twice - once per language - because an unmatched URL
 * says nothing about which language the reader came for.
 */
export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <main className="mx-auto max-w-[700px] flex-1 px-4 py-20 text-center sm:px-6">
          <h1 className="text-xl font-bold text-[color:var(--color-navy)]">
            Page not found
          </h1>
          <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
            The page you requested does not exist. The observatory&apos;s main
            sections are linked below.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            {[
              ["/", "Home"],
              ["/compare", "2024 vs 2026"],
              ["/actors", "Actor layers"],
              ["/map", "Map"],
              ["/finance", "Finance & delivery"],
              ["/explorer", "Data explorer"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--color-border)] bg-white px-4 text-[color:var(--color-navy)] hover:border-[color:var(--color-navy)]"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <p lang="ar" dir="rtl" className="mt-10 text-sm text-[color:var(--color-text-secondary)]">
            الصفحة المطلوبة غير موجودة.{" "}
            <Link
              href="/ar"
              className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
            >
              عودة إلى الصفحة الرئيسية بالعربية
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
