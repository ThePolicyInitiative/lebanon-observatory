/**
 * Arabic locale content. The analytical figures stay identical across
 * locales - only the framing prose is translated, so no number can drift
 * between the two versions.
 */

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!configuredSiteUrl && process.env.NODE_ENV === "production") {
  // Loud, because the failure is quiet: a production build without this
  // variable ships localhost canonicals, hreflang pairs, OG URLs and
  // sitemap entries that look fine in every visual check.
  console.warn(
    "[site] NEXT_PUBLIC_SITE_URL is not set - canonical, hreflang and sitemap URLs will point at localhost.",
  );
}
export const SITE_URL = configuredSiteUrl || "http://localhost:3000";

/**
 * The canonical address of a page and the address of its counterpart in the
 * other language, in the form Next's Metadata API expects.
 *
 * Both versions of a page say the same things about the same figures, so
 * without this pairing a search engine has to guess which one it is looking
 * at - and, since the two share a layout, it tends to guess wrong.
 *
 * `path` is the English route ("/" , "/money"); the Arabic counterpart is
 * always the same route under /ar.
 */
export function localeAlternates(path: string, locale: "en" | "ar" = "en") {
  const en = path;
  const ar = path === "/" ? "/ar" : `/ar${path}`;
  return {
    canonical: locale === "ar" ? ar : en,
    languages: { en, ar, "x-default": en },
  };
}

/** Accessible names for the furniture every page carries. */
export const CHROME = {
  en: {
    skip: "Skip to content",
    primaryNav: "Primary",
    primaryNavMobile: "Primary mobile",
    footerNav: "Footer",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    loading: "Loading page",
    takeaways: "Key takeaways",
  },
  ar: {
    skip: "تخطَّ إلى المحتوى",
    primaryNav: "التنقّل الرئيسي",
    primaryNavMobile: "التنقّل الرئيسي على الهاتف",
    footerNav: "روابط أسفل الصفحة",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    loading: "جارٍ تحميل الصفحة",
    takeaways: "الخلاصات",
  },
} as const;

export const AR = {
  meta: {
    title: "مرصد إعادة إعمار لبنان",
    description:
      "منصة ترسم وتتتبّع وتقارن استجابة لبنان للتعافي وإعادة الإعمار بعد حربَي 2024 و2026: الجهات في أربع مجموعات، والأفعال في أربع فئات، ومرحلة التنفيذ حيثما سمح ما نُشر علناً.",
  },
  nav: {
    /*
     * The tabs are questions now, not topics. The wide labels below carry
     * the whole question; SiteNav prints the short form on a narrow
     * screen, because a five-word question does not fit a phone tab bar
     * and a truncated question is worse than a short one.
     */
    built: "هل أُنجز شيء؟",
    builtShort: "أُنجز؟",
    who: "من يفعل ماذا؟",
    whoShort: "من؟",
    money: "أين ذهب المال؟",
    moneyShort: "المال؟",
    destroyed: "ما الذي دُمِّر؟",
    destroyedShort: "الدمار؟",
    reported: "ماذا يُنشَر؟",
    reportedShort: "يُنشَر؟",
    methodology: "كيف بُني هذا؟",
    methodologyShort: "كيف؟",
    /*
     * The footer's topic names. It says what each page holds, because a
     * reader at the foot of a page has already read it and is looking for
     * a subject by name; the questions above are for a reader arriving.
     *
     * `map` is gone with the route it named: the map is a section of /who,
     * and `actors` says so.
     */
    home: "الرئيسية",
    compare: "مقارنة الاستجابتين",
    actors: "الجهات الفاعلة والخريطة",
    damage: "الأضرار",
    finance: "التمويل",
    news: "مستجدات",
    explorer: "المستكشف",
    // `methodology` above carries the question form, so the footer's topic
    // name for the same route lives under `method`.
    method: "المنهجية",
    english: "English",
    arabic: "العربية",
  },
  /**
   * The hero keeps only its eyebrow: the rebuilt home draws its title,
   * lede and findings from src/lib/framework.ts, where the two languages
   * live side by side. The old title, ledes and section narratives were
   * removed with the frame they described - dead strings here would keep
   * being scanned by the copy audits as if a reader could still see them.
   */
  hero: {
    eyebrow: "مرصد إعادة إعمار لبنان",
  },
  footer: {
    explore: "تصفّح",
  },
  notice:
    "هذا الموقع متاح بالعربية كاملاً: الصفحات والرسوم والخريطة التفاعلية والمستكشف والمستجدات كلها تعمل بالعربية. وما اقتُبس من إبلاغ خارجي - عناوين الناشرين في شريط المستجدات وبعض نصوص التغطية والوقائع - يبقى بلغته الأصلية.",

  /** Shared wording for the Arabic counterparts of the English pages. */
  common: {
    openEnglish: "افتح الصفحة الإنجليزية الكاملة",
    figuresNote:
      "الأرقام في هذه الصفحة مأخوذة من المرجع نفسه الذي تستخدمه النسخة الإنجليزية، فلا يمكن أن تختلف بين اللغتين.",
    englishModules:
      "ما اقتُبس في هذه الصفحة من إبلاغ خارجي - عناوين الناشرين وبعض نصوص التغطية المفتوحة - يبقى بلغته الأصلية.",
    backToArabicHome: "عودة إلى الصفحة الرئيسية بالعربية",
  },

  /** One entry per page, mirroring the English routes under /ar. */
  pages: {
    who: {
      desc:
        "أربع مجموعات فاعلة في إعادة إعمار لبنان - المؤسسات الرسمية، والمنظمات الدولية وغير الحكومية، والبلديات، والمجتمع المحلي - لعامي 2024 و2026، بأدوارها وتحوّلاتها.",
      title: "مجموعات الجهات الفاعلة",
      lede: "أربع مجموعات تتكرر في كل صفحات المرصد: المؤسسات الرسمية، والمنظمات الدولية وغير الحكومية، والبلديات والسلطات المحلية، ومبادرات المجتمع المحلي. المجموعة الدولية تضم جهات متفاوتة الصلاحية - وكالة أممية ومصرف تنموي وجمعية محلية ليست متكافئة.",
      point:
        "الخلاصة المتكررة: في القرى الجنوبية، العمل الظاهر فعلياً يقوم به الأهالي والجمعيات والبلديات، وغالباً على نفقتهم الخاصة.",
    },
    destroyed: {
      desc:
        "تقديرات أضرار حربي 2024 و2026 في لبنان: أربعة مسارات لا تُجمع لعام 2024، وتقييمان لمنطقتين في 2026، مع منهجية كل رقم ونطاقه وتاريخه.",
      title: "تقديرات الأضرار",
      lede: "لا يوجد رقم واحد لأبنية حرب 2024: أربعة مسارات غير قابلة للجمع تحصر حجم الدمار، والفروق بينها هي نفسها معطى - في المنهجية والنطاق والوحدة والتوقيت. أما 2026 فله تقييمان لمنطقتين محددتين فقط، ولا يُجمعان مع أي رقم من 2024.",
      point:
        "تُعرض التقديرات جنباً إلى جنب ولا تُجمع ولا يؤخذ متوسطها. تعدّد التقديرات أخّر إرساء مرجع واحد للتعويضات.",
    },
    money: {
      desc:
        "التمويل مقابل الإنجاز في إعادة إعمار لبنان: الاحتياج والإطار والالتزام والدفع الفعلي أشياء مختلفة، وإطار LEAP ليس مكافئاً للاحتياج الوطني.",
      title: "التمويل مقابل الإنجاز",
      lede: "الاحتياج المقدَّر شيء، والإطار شيء آخر، والالتزام غيرهما، والدفع الفعلي غيرها جميعاً. إطار LEAP البالغ مليار دولار ليس مكافئاً للاحتياج الوطني البالغ 11 مليار دولار، والمبلغ المدفوع ليس دليلاً على أشغال قائمة.",
      point:
        "حتى 31 آب 2026 لم يُعرض أي عقد أشغال مُرسى على بوابة الشراء، وبقيت مؤشرات الإنجاز المادي المعلنة عند الصفر.",
    },
    reported: {
      desc:
        "تجميع آلي لتغطية إعادة إعمار لبنان من ناشرين لبنانيين ودوليين وإنسانيين ورسميين، مفصولاً عن تحليل المرصد ولا يدخل في أي عدّ من أعداده.",
      title: "مستجدات مباشرة",
    },
    entries: {
      desc:
        "كل مدخل متتبَّع في مرصد إعادة إعمار لبنان، قابلاً للترشيح بالسنة والمجموعة والمرحلة وحالة التنفيذ ودرجة القابلية للمقارنة.",
      title: "مستكشف المدخلات",
      lede: "كل مدخل متتبَّع في المرصد، قابلاً للترشيح بالسنة والمجموعة والمرحلة وحالة التنفيذ ودرجة القابلية للمقارنة.",
      point:
        "المدخل يشير إلى حضور متتبَّع لجهة في مرحلة - لا إنفاقاً ولا إنجازاً ولا تغطية جغرافية.",
    },
  },
} as const;
