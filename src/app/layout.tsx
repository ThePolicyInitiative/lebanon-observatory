import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
    siteName: "Lebanon Reconstruction Observatory",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lebanon Reconstruction Observatory",
    description:
      "Tracking Lebanon's reconstruction town by town: rubble, works, finance and return, 2024-2026.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
        <a href="#main-content" className="skip-link">
          Skip to content
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
