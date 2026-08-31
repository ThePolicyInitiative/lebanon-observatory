import serviceImpact from "@/data/service-impact.json";
import type { Locale } from "@/lib/vocab";

/**
 * 2026 service-restoration status: dated, per-sector figures showing that
 * services ran on the emergency chains, not yet on LEAP works.
 */
export default function ServiceImpact({ locale = "en" }: { locale?: Locale } = {}) {
  const ar = locale === "ar";
  return (
    <figure className="card card-interactive">
      <figcaption>
        <h3 className="text-lead font-semibold text-navy">
          {ar
            ? "الخدمات تحت حرب 2026: الاستعادة التي جرت على سلاسل الطوارئ"
            : "Services under the 2026 war: the restoration that had to run on emergency chains"}
        </h3>
        <p className="mt-1 text-body text-text-secondary">
          {ar
            ? "كل رقم يحمل تاريخه والجهة التي أعلنته؛ ولا واحد منها إسقاط مستقبلي."
            : "Each figure carries its own date and reporter; none is a projection."}
        </p>
      </figcaption>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {serviceImpact.items.map((item) => (
          <div
            key={item.sector}
            className="panel-sunken p-4"
          >
            <p className="text-micro font-bold uppercase tracking-wide text-text-secondary">
              {ar ? (item.sectorAr ?? item.sector) : item.sector}
            </p>
            <p className="mt-1 text-h3 font-bold leading-snug tracking-tight text-navy">
              {ar ? (item.figureAr ?? item.figure) : item.figure}
            </p>
            <p className="mt-1.5 text-meta leading-relaxed text-text-secondary">
              {ar ? (item.detailAr ?? item.detail) : item.detail}
            </p>
            <p className="mt-2 border-t border-dashed border-border pt-1.5 text-micro font-medium text-text-secondary">
              {ar ? (item.reporterAr ?? item.reporter) : item.reporter}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}
