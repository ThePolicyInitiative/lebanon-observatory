import type { Metadata } from "next";
import Link from "next/link";
import AboutBody from "./AboutBody";
import { ABOUT } from "@/lib/about-content";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

const t = ABOUT.en;

export const metadata: Metadata = {
  alternates: localeAlternates("/about"),
  title: t.metaTitle,
  description: t.metaDesc,
};

/**
 * Identity, purpose, scope, limits, contact and update rhythm - and
 * nothing beyond that. The analytical pages carry the analysis; this page
 * exists so a reader can tell who is counting and what the count refuses
 * to say.
 */
export default function AboutPage() {
  return (
    <PageShell
      title={t.title}
      lede={t.lede}
      point={t.point}
    >

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t.figures.map((f) => (
          <li key={f.label} className="card p-3.5">
            <p className="figure-number text-2xl text-[color:var(--color-navy)]">
              {f.value}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {f.label}
            </p>
          </li>
        ))}
      </ul>

      <AboutBody />

      {/* The language toggle in the header only crosses over for routes it
          knows; an explicit pair here keeps the two identity pages joined
          whatever the navigation carries. */}
      <p className="mt-8 text-sm">
        <Link
          href="/ar/about"
          hrefLang="ar"
          className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
        >
          {t.crossLink} (<span lang="ar">{ABOUT.ar.title}</span>) →
        </Link>
      </p>
    </PageShell>
  );
}
