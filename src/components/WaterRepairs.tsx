import slwe from "@/data/slwe-posts.json";
import type { Locale } from "@/lib/vocab";

/**
 * One utility's own account of its repair work, from its public posts.
 * It sits in the web-sourced quarantine with everything else unconfirmed,
 * and it is here for one reason: almost nothing else reports reconstruction
 * at the level of a single distribution line in a single village.
 *
 * The Arabic side shows the utility's own Arabic posts rather than the
 * English translations - for these 125 entries Arabic is the source language,
 * so the Arabic reader gets the original and the English reader the rendering.
 */

const T = {
  en: {
    title: "One utility, line by line",
    badge: "Self-published · not in the tracking",
    posts: "repair posts, translated",
    south: "from the three departments south of the Litani",
    restored: "end with supply restored to subscribers",
    byDept: "By water department",
    workKinds: "What the posts describe",
    multi: "A post can describe more than one kind of work, so these do not sum to",
    localities: "Most-named localities in the posts carried here",
    supplyRestored: "supply restored",
    southTag: "·south",
  },
  ar: {
    title: "مؤسسة واحدة، خطاً بخط",
    badge: "منشور ذاتياً · خارج التتبّع",
    posts: "منشور إصلاح",
    south: "من الدوائر الثلاث جنوب الليطاني",
    restored: "تنتهي باستعادة التغذية للمشتركين",
    byDept: "بحسب دائرة المياه",
    workKinds: "ما تصفه المنشورات",
    multi: "قد يصف المنشور أكثر من نوع عمل، لذلك لا يكون المجموع",
    localities: "أكثر البلدات ذكراً في المنشورات المعروضة هنا",
    supplyRestored: "استُعيدت التغذية",
    southTag: "·جنوب",
  },
} as const;

/**
 * The classification labels are this site's own, not the utility's wording,
 * so they are written here in both languages rather than left in English on
 * the Arabic page. The town and district spellings are the ones the
 * utility's own Arabic posts use.
 */
const DEPT_AR: Record<string, string> = {
  Sidon: "صيدا",
  "Establishment-wide": "على مستوى المؤسسة",
  Nabatieh: "النبطية",
  "Bint Jbeil": "بنت جبيل",
  Zahrani: "الزهراني",
  Tyre: "صور",
  "Production Department": "دائرة الإنتاج",
  Jezzine: "جزين",
  "Wadi Jilo": "وادي جيلو",
};

const WORK_AR: Record<string, string> = {
  "Line and network maintenance": "صيانة الخطوط والشبكات",
  "Leak repair": "معالجة التسربات",
  "Pumping stations": "محطات الضخّ",
  "Wells and springs": "الآبار والينابيع",
  "Power and generators": "الكهرباء والمولّدات",
  "Reservoirs and tanks": "الخزانات والصهاريج",
};

const TOWN_AR: Record<string, string> = {
  Qabrikha: "قبريخا",
  "Safad Al-Battikh": "صفد البطيخ",
  Tibnine: "تبنين",
  Batoulay: "باتوليه",
  Zebqine: "زبقين",
  "Aain Baal": "عين بعال",
  Baraachit: "برعشيت",
  Barich: "باريش",
  Bazouriyeh: "البازورية",
  "Deir Aames": "دير عامص",
  Jmaijmeh: "الجميجمة",
  Srifa: "صريفا",
  Yater: "ياطر",
};

const DISTRICT_AR: Record<string, string> = {
  Marjaayoun: "مرجعيون",
  "Bent Jbeil": "بنت جبيل",
  Sour: "صور",
};

export default function WaterRepairs({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const ar = locale === "ar";
  /** Letter-spacing breaks connected Arabic script. */
  const caps = ar ? "" : "uppercase tracking-wide";
  const say = (table: Record<string, string>, key: string) =>
    ar ? (table[key] ?? key) : key;
  const maxDept = Math.max(...slwe.departments.map((d) => d.posts));
  const maxWork = Math.max(...slwe.work.map((w) => w.posts));
  const restoredShare = Math.round((slwe.restoredCount / slwe.totalPosts) * 100);

  return (
    <section
      aria-labelledby="water-repairs"
      className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[#FBFCFD] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="water-repairs" className="text-xl font-semibold text-[color:var(--color-navy)]">
          {t.title}
        </h2>
        <span
          className={`rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[10px] font-bold text-[#8a6200] ${caps}`}
        >
          {t.badge}
        </span>
      </div>
      <p className="mt-2 prose-measure text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        {ar ? (
          <>
            تنشر مؤسسة مياه لبنان الجنوبي كل إصلاح تقوم به. {slwe.totalPosts} من تلك
            المنشورات، مجمَّعة هنا، هي أدقّ وصف لأعمال الاستعادة في هذا الموقع كله - أنبوب
            انفجر في بلدة، خط ضخّ، ماسورة توزيع قطرها 63 ملم. لا شيء منها مؤكَّد، ولا يدخل
            أي منها في العدّ. وتستحق القراءة رغم ذلك، لأن التتبّع الرسمي لا يملك أداة بهذه
            الدقة.
          </>
        ) : (
          <>
            The {slwe.actor} publishes each repair it makes. {slwe.totalPosts} of those posts,
            translated and grouped here, are the finest-grained account of restoration work
            anywhere in this site - a burst pipe in one village, a pumping line, a 63 mm
            distribution main. None of it is confirmed, and none of it enters the counts. It is
            worth reading anyway, because the formal tracking has no instrument this small.
          </>
        )}
      </p>

      {/* Headline figures */}
      <dl className="mt-4 grid gap-3 sm:grid-cols-4">
        {[
          { k: slwe.totalPosts.toLocaleString("en-US"), v: t.posts },
          { k: String(slwe.southPosts), v: t.south },
          { k: `${restoredShare}%`, v: t.restored },
          {
            k: `${slwe.townsNamed}`,
            v: ar
              ? `بلدة مذكورة في كل منشوراتها، ${slwe.southTownsNamed} منها داخل المنطقة`
              : `localities named across all its posts, ${slwe.southTownsNamed} of them inside the area`,
          },
        ].map((s) => (
          <div key={s.v} className="panel-sunken p-3">
            <p className="figure-number text-2xl text-[color:var(--color-navy)]">{s.k}</p>
            <p className="mt-1 text-[11px] leading-snug text-[color:var(--color-text-secondary)]">
              {s.v}
            </p>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {/* Where the work is reported */}
        <div>
          <h3 className={`text-[13px] font-bold text-[color:var(--color-text-secondary)] ${caps}`}>
            {t.byDept}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {slwe.departments.map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-[12px]">
                <span className="w-36 shrink-0 truncate">
                  {say(DEPT_AR, d.name)}
                  {d.inArea ? (
                    <span className="ms-1 text-[10px] font-semibold text-[#1F6B4E]">{t.southTag}</span>
                  ) : null}
                </span>
                <span
                  aria-hidden
                  className="h-2 rounded-sm"
                  style={{
                    width: `${Math.max(4, (d.posts / maxDept) * 60)}%`,
                    background: d.inArea ? "#2F8F6B" : "#58779B",
                    opacity: 0.8,
                  }}
                />
                <span className="tabular-nums font-semibold">{d.posts}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What kind of work */}
        <div>
          <h3 className={`text-[13px] font-bold text-[color:var(--color-text-secondary)] ${caps}`}>
            {t.workKinds}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {slwe.work.map((w) => (
              <li key={w.label} className="flex items-center gap-2 text-[12px]">
                <span className="w-40 shrink-0 truncate">{say(WORK_AR, w.label)}</span>
                <span
                  aria-hidden
                  className="h-2 rounded-sm bg-[#1B8295]"
                  style={{ width: `${Math.max(4, (w.posts / maxWork) * 55)}%`, opacity: 0.75 }}
                />
                <span className="tabular-nums font-semibold">{w.posts}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
            {t.multi} {slwe.totalPosts}.
          </p>
        </div>
      </div>

      {/* Localities inside the area */}
      <div className="mt-5">
        <h3 className={`text-[13px] font-bold text-[color:var(--color-text-secondary)] ${caps}`}>
          {t.localities}
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {ar
            ? `محسوبة على منشورات الدوائر الثلاث داخل المنطقة، وهي المجموعة المعروضة أدناه ونفسها التي يحملها التتبّع. ودوائر المؤسسة الأخرى تذكر أيضاً أماكن جنوبية، وتلك ضمن الـ${slwe.southTownsNamed} أعلاه لا ضمن هذه اللائحة.`
            : `Counted across the posts of the three departments inside the area, which is the set listed below and the set this compilation carries. The establishment's other departments also name southern places; those are in the ${slwe.southTownsNamed} above, not in this list.`}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {/* Named `town`, not `t`: the locale table is also called t, and a
              shadowed lookup here printed the district in English on both
              pages. */}
          {slwe.topSouthTowns.map((town) => (
            <li
              key={town.name}
              className="chip"
              title={
                ar
                  ? `قضاء ${say(DISTRICT_AR, town.district)}`
                  : `${town.district} district`
              }
            >
              {say(TOWN_AR, town.name)}
              <span className="ms-1 tabular-nums text-[color:var(--color-text-secondary)]">
                {town.posts}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Every post from the departments inside the area */}
      <div className="mt-5">
        <h3 className={`text-[13px] font-bold text-[color:var(--color-text-secondary)] ${caps}`}>
          {ar
            ? `بكلماتها هي: كل المنشورات الـ${slwe.areaPosts.length} من الدوائر داخل المنطقة`
            : `In its own words: all ${slwe.areaPosts.length} posts from the departments inside the area`}
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {ar
            ? `بنت جبيل وصور ووادي جيلو كاملة، بلا انتقاء. أما الـ${slwe.totalPosts - slwe.areaPosts.length} منشوراً الباقية فهي من دوائر المؤسسة الأخرى، خارج منطقة هذا العمل.`
            : `Bint Jbeil, Tyre and Wadi Jilo in full, nothing selected out. The remaining ${slwe.totalPosts - slwe.areaPosts.length} posts come from the establishment's other departments, outside this work's area.`}
        </p>
        <ul className="mt-2 max-h-[28rem] space-y-2 overflow-y-auto pe-1">
          {slwe.areaPosts.map((p) => (
            <li key={p.no} className="panel-sunken p-3">
              <p
                className={`flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-[color:var(--color-text-secondary)] ${caps}`}
              >
                <span>{say(DEPT_AR, p.department)}</span>
                {p.towns ? (
                  <span className="rounded-sm bg-[#E8F1EC] px-1.5 py-0.5 normal-case text-[#1F6B4E]">
                    {say(TOWN_AR, p.towns)}
                  </span>
                ) : null}
                {p.restored ? (
                  <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 normal-case text-[color:var(--color-navy)]">
                    {t.supplyRestored}
                  </span>
                ) : null}
              </p>
              {/* Arabic is the source language for these posts. */}
              <p
                dir={ar ? "rtl" : "ltr"}
                className="mt-1 text-[12.5px] leading-relaxed text-[color:var(--color-text)]"
              >
                {ar ? p.arabic || p.text : p.text}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px]">
          <a
            href={slwe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            {slwe.sourceName} ↗
          </a>
          <span className="ms-2 text-[color:var(--color-text-secondary)]">
            {ar
              ? "لم يحمل ما جُمع روابط لكل منشور، فهذه الصفحة لا المنشور المفرد."
              : "The export carried no per-post links, so this is the page, not the single post."}
          </span>
        </p>
      </div>

      {/* What this is not */}
      <details className="mt-5 rounded-md border border-dashed border-[color:var(--color-border)] bg-white p-3">
        <summary className="cursor-pointer text-[12px] font-bold text-[color:var(--color-navy)]">
          {ar
            ? `من أين يأتي هذا، وما الذي لا يستطيع قوله (${slwe.caveats.length})`
            : `Where this comes from, and what it cannot tell you (${slwe.caveats.length})`}
        </summary>
        <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {(ar ? slwe.caveatsAr : slwe.caveats).map((c) => (
            <li key={c.slice(0, 30)} className="flex gap-2">
              <span
                aria-hidden
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-rust)]"
              />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
