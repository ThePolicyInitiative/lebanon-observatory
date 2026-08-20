import webUpdates from "@/data/web-updates.json";
import { LAYER_META } from "@/lib/colors";
import { fmtDate } from "@/lib/format";
import { layers, type Locale } from "@/lib/vocab";

const T = {
  en: {
    title: "Reported beyond the tracking",
    badge: "Web-sourced · not in the tracking",
    institutional: "Institutional source",
    press: "Press report",
    social: "Social post - self-published",
    south: "South of the Litani",
    noDate: "date not stated",
    seeMore: "See more",
    seeLess: "See less",
    where: "Where:",
    indirect: "page not opened directly",
  },
  ar: {
    title: "مرصود خارج التتبّع",
    badge: "من مصادر إلكترونية · خارج التتبّع",
    institutional: "مصدر مؤسسي",
    press: "تقرير صحفي",
    social: "منشور اجتماعي - ذاتي النشر",
    south: "جنوب الليطاني",
    noDate: "التاريخ غير مذكور",
    seeMore: "تفاصيل أكثر",
    seeLess: "إخفاء التفاصيل",
    where: "أين:",
    indirect: "لم تُفتح الصفحة مباشرة",
  },
} as const;

/**
 * Actors and actions reported by external web sources, beyond what the
 * the tracking itself carries. Deliberately quarantined: nothing here enters
 * the counts, matrices or maps - each entry states only what its linked
 * source reports, with the source named beside it and a caution where the
 * claim needs one.
 */

/** Colour by source kind; the wording comes from the locale table above. */
const SOURCE_KIND_CLS: Record<string, string> = {
  institutional: "bg-[#E8F1F3] text-[color:var(--color-teal)]",
  press: "bg-[#EEF2F7] text-[color:var(--color-navy)]",
  social: "bg-[#FAF3E3] text-[#8a6200]",
};

type Update = (typeof webUpdates.updates)[number];

function Card({ u, locale }: { u: Update; locale: Locale }) {
  const t = T[locale];
  const meta = layers(locale).find((l) => l.id === u.layer);
  return (
    <li className="card p-3.5">
      <p className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {meta ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-semibold text-white"
            style={{ background: meta.color }}
          >
            {meta.label}
          </span>
        ) : null}
        {u.sourceKind ? (
          <span
            className={`rounded-sm px-1.5 py-0.5 font-semibold ${
              SOURCE_KIND_CLS[u.sourceKind] ?? "bg-[#F2F2EF] text-[color:var(--color-text-secondary)]"
            }`}
          >
            {(t as Record<string, string>)[u.sourceKind] ?? u.sourceKind}
          </span>
        ) : null}
        {u.southOfLitani ? (
          <span className="rounded-sm bg-[#E8F1EC] px-1.5 py-0.5 font-semibold text-[#1F6B4E]">
            {t.south}
          </span>
        ) : null}
        {u.dateReported ? (
          <span className="font-semibold tabular-nums text-[color:var(--color-text-secondary)]">
            {fmtDate(u.dateReported, locale)}
          </span>
        ) : u.dateText ? (
          <span className="font-semibold text-[color:var(--color-text-secondary)]">
            {u.dateText}
          </span>
        ) : (
          <span className="text-[color:var(--color-text-secondary)]">{t.noDate}</span>
        )}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[color:var(--color-navy)]">{u.actor}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-text)]">{u.action}</p>
      {/* Named group: the card sits inside the layer disclosure, so an
          unnamed group-open would follow that one instead of this. */}
      {u.detail ? (
        <details className="group/more mt-1.5">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[11px] font-semibold text-[color:var(--color-blue)] underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open/more:hidden">{t.seeMore}</span>
            <span className="hidden group-open/more:inline">{t.seeLess}</span>
            <span aria-hidden className="text-[9px]">
              <span className="group-open/more:hidden">▸</span>
              <span className="hidden group-open/more:inline">▾</span>
            </span>
          </summary>
          <p className="mt-1 border-l-2 border-[color:var(--color-border)] pl-2.5 text-[12px] leading-relaxed text-[color:var(--color-text-secondary)]">
            {u.detail}
          </p>
        </details>
      ) : null}
      {u.place ? (
        <p className="mt-1.5 text-[11px] text-[color:var(--color-text-secondary)]">
          <span className="font-semibold">{t.where}</span> {u.place}
        </p>
      ) : null}
      {u.caution ? (
        <p className="note-caution mt-2 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {u.caution}
        </p>
      ) : null}
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-dashed border-[color:var(--color-border)] pt-1.5 text-[11px]">
        <a
          href={u.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
        >
          {u.sourceName} ↗
        </a>
        {u.openedDirectly === false ? (
          <span className="rounded-sm bg-[#FAF3E3] px-1.5 py-0.5 font-semibold text-[#8a6200]">
            {t.indirect}
          </span>
        ) : null}
      </p>
    </li>
  );
}

export default function ReportedUpdates({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const ar = locale === "ar";
  const updates = webUpdates.updates;
  const south = updates.filter((u) => u.southOfLitani).length;
  const indirect = updates.filter((u) => u.openedDirectly === false).length;

  /** Grouped by actor layer, community first: that is where the new material is. */
  const groups = ["community", "municipal", "official", "ngo_international"]
    .map((id) => ({
      id,
      label: layers(locale).find((l) => l.id === id)?.label ?? id,
      color: LAYER_META.find((l) => l.id === id)?.color ?? "#667588",
      items: updates.filter((u) => u.layer === id),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section
      aria-labelledby="reported-updates"
      className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[#FBFCFD] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="reported-updates"
          className="text-xl font-semibold text-[color:var(--color-navy)]"
        >
          {t.title}
        </h2>
        <span className="rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a6200]">
          {t.badge}
        </span>
      </div>
      {ar ? (
        <>
          <p className="mt-2 prose-measure text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {updates.length} جهة وفعلاً وردت في تغطية مفتوحة على الإنترنت بالعربية والإنجليزية
            والفرنسية (جُمعت في {fmtDate(webUpdates.gatheredOn, "ar")})، منها {south} في المنطقة بين
            الليطاني والخط الأزرق. هذه ادّعاءات منقولة عن مصادرها - لم تُقارَن بالتتبّع ولا تدخل
            في أي عدّ أو خريطة في هذا الموقع. كل مدخل يذكر مقدار التدقيق خلفه، و{indirect} منها
            مُعلَّمة لأن صفحة الناشر رفضت الطلب الآلي ولم يتوفّر سوى ملخّص بحث. اتبع كل رابط
            لتحكم على المصدر بنفسك.
          </p>
          <p className="mt-2 prose-measure text-sm leading-relaxed text-[color:var(--color-text)]">
            مجموعة المجتمع المحلي هي الأكبر، وتلك هي الخلاصة: في القرى الجنوبية، العمل الظاهر
            فعلياً يقوم به الأهالي والجمعيات القروية والمجموعات الشبابية والبلديات، وعلى نفقتهم
            الخاصة في معظمه.
          </p>
          <p className="mt-2 prose-measure text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
            نصّ كل مدخل يبقى بلغة مصدره، فما نُقل عن ناشر عربي يظهر بالعربية وما نُقل عن ناشر
            أجنبي يظهر بلغته - حتى لا تضيف الترجمة طبقة بين القارئ والمصدر.
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 prose-measure text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {updates.length} actors and actions found in open web coverage in English, Arabic and
            French (gathered {fmtDate(webUpdates.gatheredOn)}), {south} of them in the area between
            the Litani and the Blue Line. These are reported claims, quoted with their sources - they
            are not checked against the tracking and enter none of this site&apos;s counts or maps.
            Each entry says how much checking sits behind it, and {indirect} are marked because
            the publisher&apos;s page refused an automated request and only a search summary could be
            reached. Follow each link to judge the source yourself.
          </p>
          <p className="mt-2 prose-measure text-sm leading-relaxed text-[color:var(--color-text)]">
            The community group is the largest, and that is the finding: in the southern villages the
            work that is actually visible is being done by residents, village associations, youth
            groups and municipalities, largely at their own cost.
          </p>
        </>
      )}

      <div className="mt-5 space-y-4">
        {groups.map((g, i) => (
          <details key={g.id} open={i === 0} className="group">
            <summary className="flex cursor-pointer items-center gap-2 rounded-sm py-1 text-sm font-semibold text-[color:var(--color-navy)]">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: g.color }}
              />
              {g.label}
              <span className="font-normal text-[color:var(--color-text-secondary)]">
                ({g.items.length})
              </span>
              <span aria-hidden className="text-[color:var(--color-text-secondary)]">
                <span className="group-open:hidden">▸</span>
                <span className="hidden group-open:inline">▾</span>
              </span>
            </summary>
            <ul className="mt-2 grid gap-3 md:grid-cols-2">
              {g.items.map((u) => (
                <Card key={u.sourceUrl + u.actor} u={u} locale={locale} />
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
