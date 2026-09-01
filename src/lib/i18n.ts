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
     * The tabs are the reconstruction report's table of contents: the
     * aim, the two analytical layers, the findings, the method, and the
     * live continuation of the search. SiteNav prints the short form on
     * a narrow screen.
     */
    aim: "الهدف",
    aimShort: "الهدف",
    actors2: "الجهات الفاعلة",
    actors2Short: "الجهات",
    actions: "الأفعال",
    actionsShort: "الأفعال",
    map: "الخريطة",
    mapShort: "الخريطة",
    findings: "الاستنتاجات",
    findingsShort: "استنتاجات",
    methodology: "المنهجية",
    methodologyShort: "منهجية",
    reported: "التغطية المباشرة",
    reportedShort: "مباشر",
    /*
     * The header's search control, beside the language switch - not a
     * tab and not a footer topic, so it sits between the two lists.
     */
    search: "البحث",
    /*
     * The footer's topic names. It says what each page holds, because a
     * reader at the foot of a page has already read it and is looking for
     * a subject by name.
     */
    home: "الرئيسية",
    actors: "مجموعات الجهات",
    news: "مستجدات",
    explorer: "المستكشف",
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
    actors: {
      desc:
        "أربع مجموعات فاعلة في إعادة إعمار لبنان - المؤسسات الرسمية، والمنظمات الدولية وغير الحكومية، والبلديات، والمجتمع المحلي - لعامي 2024 و2026، بأدوارها وتحوّلاتها.",
      title: "مجموعات الجهات الفاعلة",
      lede: "أربع مجموعات تتكرر في كل صفحات المرصد: المؤسسات الرسمية، والمنظمات الدولية وغير الحكومية، والبلديات والسلطات المحلية، ومبادرات المجتمع المحلي. المجموعة الدولية تضم جهات متفاوتة الصلاحية - وكالة أممية ومصرف تنموي وجمعية محلية ليست متكافئة.",
      point:
        "الخلاصة المتكررة: في القرى الجنوبية، العمل الظاهر فعلياً يقوم به الأهالي والجمعيات والبلديات، وغالباً على نفقتهم الخاصة.",
    },
    actions: {
      desc:
        "طبقة الأفعال في إعادة إعمار لبنان: أربع فئات - الإجراءات المالية، وتقييم الأضرار وإدارتها، والإغاثة والتعافي المجتمعي، وإعادة الإعمار والتنفيذ - وما رُصد تحت كل منها في 2024 و2026.",
      title: "طبقة الأفعال",
      lede: "كل ما رُصدت الجهات وهي تقوم به، مصنّفاً في أربع فئات للأفعال، مع مراحل الاستجابة التي تنتظم داخلها ومرحلة التنفيذ حيثما سمح ما نُشر علناً. الفئات تُجمع عبر المجموعات الأربع معاً - هذه صفحة عن العمل نفسه، لا عن من قام به.",
      point:
        "الأعداد هنا مجاميع فئات ومراحل عبر كل المجموعات - وهي تقيس حضوراً مرصوداً، لا إنفاقاً ولا إنجازاً مكتملاً.",
    },
    findings: {
      desc:
        "الاستنتاجات الخمسة لمقارنة استجابتَي 2024 و2026: احتياجات تفوق القدرة، وأطر تمويل ليست مالاً في اليد، وخطة أقوى من استجابتها، ودور أوسع للمبادرات الأهلية، وتركّز في المراحل المبكرة.",
      title: "الاستنتاجات",
      lede: "خمسة استنتاجات تخرج من قراءة الاستجابتين عبر طبقتَي الجهات والأفعال، ولكل استنتاج هنا نصّه الكامل وعمقه: تقديرات الأضرار خلف المرجع البالغ 11 مليار دولار، ومسار المال من الإطار إلى الدفع، وبنى القيادة جنباً إلى جنب.",
      point:
        "تقديرات الأضرار لا تُجمع ولا يؤخذ متوسطها، والتمويل المعلن ليس تمويلاً مدفوعاً، ولا شيء هنا يُعرض كإنجاز مكتمل.",
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
