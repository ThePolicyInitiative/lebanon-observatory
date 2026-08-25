import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import Link from "next/link";
import { AR, localeAlternates } from "@/lib/i18n";
import { locations } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import LebanonMap from "@/components/map/LebanonMap";
import RegionalComposition from "@/components/map/RegionalComposition";
import { layers, regionLabel } from "@/lib/vocab";
import type { ActorLayer } from "@/lib/types";

export const metadata: Metadata = {
  title: AR.pages.map.title,
  description: AR.pages.map.desc,
  alternates: localeAlternates("/map", "ar"),
};

type Mentions = Record<ActorLayer, number>;

export default function Page() {
  const ar = layers("ar");
  const rows = locations.regions.map((r) => {
    const m24 = locations.mentions["2024"][r.id as keyof (typeof locations.mentions)["2024"]] as Mentions;
    const m26 = locations.mentions["2026"][r.id as keyof (typeof locations.mentions)["2026"]] as Mentions;
    const sum = (m: Mentions | undefined) =>
      m ? ar.reduce((s, l) => s + (m[l.id] ?? 0), 0) : 0;
    return {
      id: r.id,
      label: regionLabel(r.id, "ar"),
      mappable: r.mappable,
      y24: sum(m24),
      y26: sum(m26),
      byLayer26: ar.map((l) => ({ ...l, n: m26?.[l.id] ?? 0 })),
    };
  });
  const max = Math.max(...rows.flatMap((r) => [r.y24, r.y26]));
  const mappable = rows.filter((r) => r.mappable);
  const notMappable = rows.filter((r) => !r.mappable);

  return (
    <ArabicPageShell
      title={AR.pages.map.title}
      lede={AR.pages.map.lede}
      point={AR.pages.map.point}
      englishHref="/map"
      figures={[
        { value: String(locations.regions.length), label: "تجمّع إقليمي في التتبّع" },
        { value: String(mappable.length), label: "منها يمكن وضعه على الخريطة" },
        { value: String(notMappable.length), label: "يُعرض منفصلاً لتعذّر توطينه" },
        { value: "168", label: "بلدة جنوب الليطاني ضمن نطاق العمل" },
      ]}
    >
      {/* The full interactive map, the same module the English page
          mounts, in Arabic. */}
      <section aria-labelledby="ar-interactive" className="mt-7">
        <h2 id="ar-interactive" className="text-xl font-semibold text-[color:var(--color-navy)]">
          أين تركّز النشاط المرصود
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          دبّوس واحد لكل مدخل متتبَّع، موضوع في البلدة التي يسمّيها الإبلاغ.
          رشّح بالسنة وطبقة الجهات والمرحلة وحالة التنفيذ، وابحث عن بلدة
          لتقريب الخريطة إليها.
        </p>
        <div className="mt-4">
          <Suspense fallback={<div className="h-[680px] animate-pulse rounded-md bg-white" />}>
            <LebanonMap locale="ar" />
          </Suspense>
        </div>
      </section>

      <div className="mt-7">
        {/* The standing geography caution is already printed above the map. */}
        <RegionalComposition locale="ar" showCaveat={false} />
      </div>

      <section className="mt-8 max-w-3xl card p-3.5 text-sm leading-relaxed">
        <h2 className="text-sm font-semibold text-[color:var(--color-navy)]">
          لماذا لا توجد طبقة أضرار وطنية
        </h2>
        <p className="mt-2 text-[color:var(--color-text)]">
          تغطي التقييمات السريعة لعام 2026 منطقتين اثنتين - جنوب الليطاني
          (بتدقيق مكتبي) وبيروت-جبل لبنان (بفحص ميداني) - بينما لم يكن
          للبقاع وبعلبك-الهرمل، وقد بلغتهما الحرب، أي تقييم مواز بحلول
          تاريخ التوقف.
          ودمج هذين المنتجين الجزئيين في مقياس أضرار وطني واحد يصنع مقارنة
          زائفة، ولذلك لا يرسم هذا المرصد تقديرات الأضرار على مفتاح مشترك.
          الأرقام على مستوى كل منطقة، مع شارة قابلية المقارنة وطريقة
          التثبيت لكل رقم، معروضة في{" "}
          <Link href="/ar/damage" className="underline underline-offset-2">
            صفحة تقديرات الأضرار
          </Link>
          ، إلى جانب مسارات عدّ الأبنية الأربعة غير القابلة للجمع لعام 2024.
        </p>
      </section>

      {/* The regional bar list stays as a reading complement below the
          interactive map: the same totals, glanceable without a pointer. */}
      <section aria-labelledby="ar-regions" className="mt-8">
        <h2 id="ar-regions" className="text-xl font-semibold text-[color:var(--color-navy)]">
          الإشارات إلى الأماكن، تجمّعاً بتجمّع
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          كل مدخل قد يسمّي مكاناً واحداً أو أكثر. ما يظهر هنا هو عدد الإشارات، لا حجم
          العمل ولا شدّة الضرر.
        </p>
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card p-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-[color:var(--color-navy)]">
                  {r.label}
                  {!r.mappable ? (
                    <span className="ms-2 rounded-sm bg-[#F2F2EF] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-text-secondary)]">
                      خارج الخريطة
                    </span>
                  ) : null}
                </span>
                <span className="text-[11px] tabular-nums text-[color:var(--color-text-secondary)]">
                  2024: {r.y24} · 2026: {r.y26}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {[
                  { year: "2024", v: r.y24, color: "#58779B" },
                  { year: "2026", v: r.y26, color: "#2F8F6B" },
                ].map((row) => (
                  <div key={row.year} className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-10 shrink-0 tabular-nums text-[color:var(--color-text-secondary)]">
                      {row.year}
                    </span>
                    <span
                      aria-hidden
                      className="h-2.5 rounded-sm"
                      style={{ width: `${Math.max(2, (row.v / max) * 70)}%`, background: row.color, opacity: 0.85 }}
                    />
                    <span className="tabular-nums font-semibold">{row.v}</span>
                  </div>
                ))}
              </div>
              {r.y26 > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {r.byLayer26
                    .filter((l) => l.n > 0)
                    .map((l) => (
                      <li key={l.id} className="chip bg-[color:var(--color-bg)]">
                        <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: l.color }} />
                        {l.short}
                        <span className="ms-1 tabular-nums font-bold">{l.n}</span>
                      </li>
                    ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 note-caution text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          التجمّعات تختلف في المساحة والسكان وكثافة التغطية، فلا تُقارن أعدادها ببعضها
          مباشرة. والتجمّعات الثلاثة الأخيرة لا يمكن ردّها إلى محافظة واحدة، فتُعرض
          منفصلة بدل أن تُخترع لها مواقع على الخريطة.
        </p>
      </section>

      <div className="mt-7">
        <Takeaways
          locale="ar"
          changed="ثقل الإشارات انتقل نحو الجنوب والنبطية في 2026."
          unchanged="البقاع وبعلبك-الهرمل بقيا شبه غائبين عن التتبّع، وذلك غياب معطى لا غياب ضرر."
          matters="خريطة النشاط المرصود ليست خريطة الحاجة. الخلط بينهما يوجّه الموارد إلى حيث التغطية، لا حيث الضرر."
        />
      </div>
    </ArabicPageShell>
  );
}
