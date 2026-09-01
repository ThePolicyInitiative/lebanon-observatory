import Link from "next/link";
import webUpdates from "@/data/web-updates.json";
import { fmtDate } from "@/lib/format";
import type { Locale } from "@/lib/vocab";

const T = {
  en: {
    label: "Newest in open web coverage",
    href: "/reported",
    all: (n: number) => `All ${n} reported updates`,
  },
  ar: {
    label: "الأحدث في التغطية المفتوحة على الإنترنت",
    href: "/ar/reported",
    all: (n: number) => `كل المستجدات المرصودة (${n})`,
  },
} as const;

/**
 * The three newest rows of the reported layer, server-rendered straight
 * from the data - so the home page always carries fresh, readable
 * additions even when every live provider is down, and each sweep's
 * writes surface here on the next build without anyone lifting a hand.
 * The live module below it stays what it is: aggregation at request
 * time. Rows are newest-first in the data by construction.
 */
export default function LatestReported({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const rows = webUpdates.updates.slice(0, 3);

  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-wide text-text-muted">
        {t.label}
      </p>
      <ul className="mt-3 grid gap-3 lg:grid-cols-3">
        {rows.map((u) => {
          const when = u.dateReported
            ? fmtDate(u.dateReported, locale)
            : ((locale === "ar" ? (u as { dateTextAr?: string | null }).dateTextAr : u.dateText) ??
              u.dateText);
          return (
            <li key={u.sourceUrl + u.actor} className="card">
              <p className="text-meta text-text-muted">
                {when ? <span>{when} · </span> : null}
                {u.sourceName}
              </p>
              <p className="mt-1.5 text-body font-semibold text-navy">
                {locale === "ar" ? u.actorAr : u.actor}
              </p>
              <p className="mt-1 line-clamp-3 text-meta leading-relaxed text-text-secondary">
                {locale === "ar" ? u.actionAr : u.action}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-body">
        <Link
          href={t.href}
          className="font-medium text-blue underline-offset-2 hover:underline"
        >
          {t.all(webUpdates.updates.length)} {locale === "ar" ? "←" : "→"}
        </Link>
      </p>
    </div>
  );
}
