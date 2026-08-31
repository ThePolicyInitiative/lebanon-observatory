import type { ReactNode } from "react";
import type { Locale } from "@/lib/vocab";

/**
 * The two institutional maps - 2024 emergency response and 2026
 * reconstruction chain - rebuilt for the web from the printed diagrams
 * and checked line by line, so names, figures and package numbers match
 * what the analysis carries rather than the printed versions.
 *
 * Every label is written in both languages side by side rather than in two
 * separate tables. A box that gains a line in one language and not the
 * other is then visible at the point of editing, not on the page.
 */

type Tone =
  | "command"
  | "state"
  | "stateLight"
  | "delivery"
  | "international"
  | "community"
  | "gate"
  | "alert";

const TONE_BOX: Record<Tone, string> = {
  command: "bg-[#143F35] text-white border-transparent",
  state: "bg-[#2E74B5] text-white border-transparent",
  stateLight: "bg-white text-text border-[#9FB4CB]",
  delivery: "bg-[#F1F4F8] text-text border-[#C6D2DF]",
  international: "bg-teal text-white border-transparent",
  community: "bg-[#A34F7C] text-white border-transparent",
  gate: "bg-[#FBF0D5] text-[#6b4e00] border-[#D69600]",
  alert: "bg-[#FBF3F0] text-rust border-rust",
};

/** A phrase in both languages. */
type L = { en: string; ar: string };
const say = (locale: Locale, l: L) => l[locale];

type BoxSpec = { tone?: Tone; title: L; sub?: L; bullets?: L[] };
type ChainStep = { title: L; sub?: L };
type Row = { cols: string; boxes: BoxSpec[] };
type BandSpec = { n: number; title: L; rows?: Row[]; note?: L; chain?: ChainStep[] };

function Box({ tone = "stateLight", spec, locale }: { tone?: Tone; spec: BoxSpec; locale: Locale }) {
  const t = spec.tone ?? tone;
  const muted =
    t === "command" || t === "state" || t === "international" || t === "community";
  return (
    <div className={`rounded-md border-2 px-3 py-2 ${TONE_BOX[t]}`}>
      <p className="text-meta font-bold leading-snug">{say(locale, spec.title)}</p>
      {spec.sub ? (
        <p className={`mt-0.5 text-micro leading-snug ${muted ? "text-white/80" : "text-text-secondary"}`}>
          {say(locale, spec.sub)}
        </p>
      ) : null}
      {spec.bullets && spec.bullets.length > 0 ? (
        <ul className={`mt-1 space-y-0.5 text-micro leading-snug ${muted ? "text-white/85" : "text-text-secondary"}`}>
          {spec.bullets.map((b) => (
            <li key={b.en} className="flex gap-1.5">
              <span aria-hidden>·</span>
              <span>{say(locale, b)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Band({
  n,
  title,
  accent,
  children,
}: {
  n: number;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4">
      <h4 className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-meta font-bold uppercase tracking-wide text-white" style={{ background: accent }}>
        <span className="grid h-4 w-4 place-items-center rounded-full bg-white/25 text-micro">
          {n}
        </span>
        {title}
      </h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Chain({ steps, locale }: { steps: ChainStep[]; locale: Locale }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {steps.map((s, i) => (
        <li key={s.title.en} className="relative">
          <div className="h-full rounded-md border-2 border-[#C6D2DF] bg-white px-2.5 py-2">
            <p className="text-micro font-bold leading-snug text-navy">
              <span className="text-text-secondary">{i + 1}. </span>
              {say(locale, s.title)}
            </p>
            {s.sub ? (
              <p className="mt-0.5 text-micro leading-snug text-text-secondary">
                {say(locale, s.sub)}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Bands({ bands, accent, locale }: { bands: BandSpec[]; accent: string; locale: Locale }) {
  return (
    <>
      {bands.map((b) => (
        <Band key={b.n} n={b.n} title={say(locale, b.title)} accent={accent}>
          {b.rows?.map((row, i) => (
            <div key={row.cols + i} className={`${i > 0 ? "mt-2 " : ""}grid gap-2 ${row.cols}`}>
              {row.boxes.map((box) => (
                <Box key={box.title.en} spec={box} locale={locale} />
              ))}
            </div>
          ))}
          {b.chain ? <Chain steps={b.chain} locale={locale} /> : null}
          {b.note ? (
            <p className="mt-2 rounded-md bg-[#EEF2F7] px-3 py-1.5 text-center text-micro font-semibold text-navy">
              {say(locale, b.note)}
            </p>
          ) : null}
        </Band>
      ))}
    </>
  );
}

/* --------------------------------- 2024 ---------------------------------- */

const HEAD_2024 = {
  title: {
    en: "2024 war response - emergency coordination and damage baseline",
    ar: "استجابة حرب 2024 - تنسيق الطوارئ وخط أساس الأضرار",
  },
  sub: {
    en: "Emergency response chain · damage and needs baseline · basic service continuity · the foundation later used for reconstruction planning.",
    ar: "سلسلة استجابة الطوارئ · خط أساس الأضرار والاحتياجات · استمرارية الخدمات الأساسية · القاعدة التي استُخدمت لاحقاً في تخطيط إعادة الإعمار.",
  },
};

const BANDS_2024: BandSpec[] = [
  {
    n: 1,
    title: { en: "National command and coordination", ar: "القيادة والتنسيق على المستوى الوطني" },
    rows: [
      {
        cols: "lg:grid-cols-4",
        boxes: [
          {
            tone: "alert",
            title: { en: "Presidency of the Republic: vacant", ar: "رئاسة الجمهورية: شاغرة" },
            sub: {
              en: "No head of state throughout 2024; the office was filled only in January 2025.",
              ar: "لا رئيس للدولة طوال 2024؛ ولم يُملأ المنصب إلا في كانون الثاني 2025.",
            },
          },
          {
            tone: "command",
            title: {
              en: "Caretaker PM / PCM & Council of Ministers",
              ar: "رئاسة حكومة تصريف الأعمال ومجلس الوزراء",
            },
            sub: {
              en: "Najib Mikati (Caretaker PM); Mahmoud Makkiya (SG, Council of Ministers)",
              ar: "نجيب ميقاتي (رئيس حكومة تصريف الأعمال)؛ محمود مكية (أمين عام مجلس الوزراء)",
            },
          },
          {
            tone: "state",
            title: { en: "Government Emergency Committee", ar: "لجنة الطوارئ الحكومية" },
            sub: {
              en: "Coordinated by Nasser Yassin, Minister of Environment",
              ar: "بتنسيق من ناصر ياسين، وزير البيئة",
            },
          },
          {
            tone: "state",
            title: {
              en: "DRM Unit (PCM) + National Operations Room",
              ar: "وحدة إدارة مخاطر الكوارث (رئاسة الحكومة) + غرفة العمليات الوطنية",
            },
            sub: {
              en: "Real-time coordination hub receiving governorate and ministry reports",
              ar: "مركز تنسيق آني يتلقّى تقارير المحافظات والوزارات",
            },
          },
        ],
      },
      {
        cols: "lg:grid-cols-3",
        boxes: [
          {
            title: { en: "Supreme Council of Defense", ar: "المجلس الأعلى للدفاع" },
            sub: {
              en: "Maj. Gen. Mohammad al-Mustafa (Secretary-General) - security and access coordination",
              ar: "اللواء محمد المصطفى (الأمين العام) - تنسيق الأمن والوصول",
            },
          },
          {
            title: { en: "Ministry of Interior and Municipalities", ar: "وزارة الداخلية والبلديات" },
            sub: {
              en: "Bassam Mawlawi (Minister) - governors, municipalities, internal security",
              ar: "بسام مولوي (الوزير) - المحافظون والبلديات والأمن الداخلي",
            },
          },
          {
            title: { en: "Ministry of Finance", ar: "وزارة المالية" },
            sub: {
              en: "Youssef Khalil (Minister) - fiscal space and donor relations",
              ar: "يوسف خليل (الوزير) - الحيّز المالي والعلاقة بالمانحين",
            },
          },
        ],
      },
    ],
  },
  {
    n: 2,
    title: {
      en: "Damage assessment and data (baseline building)",
      ar: "تقييم الأضرار والمعطيات (بناء خط الأساس)",
    },
    rows: [
      {
        cols: "lg:grid-cols-5",
        boxes: [
          {
            tone: "international",
            title: { en: "World Bank RDNA", ar: "تقييم البنك الدولي السريع للأضرار والاحتياجات" },
            sub: {
              en: "Requested by the government; national damage and needs across ten sectors, 8 Oct 2023 - 20 Dec 2024",
              ar: "بطلب من الحكومة؛ أضرار واحتياجات وطنية في عشرة قطاعات، 8 تشرين الأول 2023 - 20 كانون الأول 2024",
            },
          },
          {
            title: { en: "CNRS-L", ar: "المجلس الوطني للبحوث العلمية" },
            sub: {
              en: "Satellite imagery, remote sensing, damage mapping and analytics",
              ar: "صور فضائية، واستشعار عن بُعد، ورسم خرائط الأضرار وتحليلها",
            },
          },
          {
            tone: "international",
            title: {
              en: "UNDP local-authority assessment",
              ar: "تقييم البرنامج الإنمائي عبر السلطات المحلية",
            },
            sub: {
              en: "Working through municipalities and unions to assess damage",
              ar: "العمل عبر البلديات واتحاداتها لتقييم الأضرار",
            },
          },
          {
            tone: "delivery",
            title: { en: "Municipalities and unions", ar: "البلديات واتحاداتها" },
            bullets: [
              { en: "Damage reporting", ar: "الإبلاغ عن الأضرار" },
              { en: "Blocked roads", ar: "الطرق المقطوعة" },
              { en: "Rubble and debris", ar: "الأنقاض والركام" },
              { en: "Electricity and water outages", ar: "انقطاع الكهرباء والمياه" },
            ],
          },
          {
            tone: "delivery",
            title: { en: "Governorates (DRM units)", ar: "المحافظات (وحدات إدارة الكوارث)" },
            bullets: [
              { en: "Validate and consolidate", ar: "التثبّت والتجميع" },
              { en: "Prioritise needs", ar: "ترتيب أولويات الحاجات" },
              { en: "Forward to national systems", ar: "الإحالة إلى الأنظمة الوطنية" },
            ],
          },
        ],
      },
    ],
    note: {
      en: "Data flows upward: the national assessment set priorities for reconstruction planning that had no financing attached in 2024.",
      ar: "المعطيات تصعد إلى الأعلى: التقييم الوطني رسم أولويات تخطيط إعادة إعمار لم يكن مربوطاً بأي تمويل في 2024.",
    },
  },
  {
    n: 3,
    title: { en: "Core implementation entities", ar: "جهات التنفيذ الأساسية" },
    rows: [
      {
        cols: "sm:grid-cols-2 lg:grid-cols-4",
        boxes: [
          {
            title: { en: "Ministry of Public Works and Transport", ar: "وزارة الأشغال العامة والنقل" },
            sub: {
              en: "Ali Hamieh (Minister) - roads, access opening, emergency repairs",
              ar: "علي حمية (الوزير) - الطرق وفتح الوصول والإصلاحات الطارئة",
            },
          },
          {
            title: { en: "Ministry of Energy and Water", ar: "وزارة الطاقة والمياه" },
            sub: {
              en: "Walid Fayad (Minister) - policy, sector oversight, prioritisation",
              ar: "وليد فياض (الوزير) - السياسات ومتابعة القطاع وترتيب الأولويات",
            },
          },
          {
            title: { en: "Électricité du Liban (EDL)", ar: "مؤسسة كهرباء لبنان" },
            sub: {
              en: "Feeders, transformers, substations; outage management",
              ar: "المغذّيات والمحوّلات ومحطات التحويل؛ وإدارة الانقطاع",
            },
          },
          {
            title: { en: "Water establishments", ar: "مؤسسات المياه" },
            sub: {
              en: "South Lebanon, Bekaa, Beirut & Mount Lebanon (SLWE, BWE, BMLWE) + Litani River Authority",
              ar: "الجنوب، والبقاع، وبيروت وجبل لبنان + المصلحة الوطنية لنهر الليطاني",
            },
          },
          {
            title: { en: "Ministry of Environment", ar: "وزارة البيئة" },
            sub: {
              en: "Nasser Yassin (Minister) - debris and rubble, environmental safeguards",
              ar: "ناصر ياسين (الوزير) - الركام والأنقاض والضمانات البيئية",
            },
          },
          {
            title: { en: "Ministry of Social Affairs", ar: "وزارة الشؤون الاجتماعية" },
            sub: {
              en: "Hector Hajjar (Minister) - shelters, displaced people, social support",
              ar: "هكتور حجار (الوزير) - مراكز الإيواء والنازحون والدعم الاجتماعي",
            },
          },
          {
            title: {
              en: "Ministry of Education and Higher Education",
              ar: "وزارة التربية والتعليم العالي",
            },
            sub: {
              en: "Abbas Halabi (Minister) - schools as shelters, education continuity",
              ar: "عباس الحلبي (الوزير) - المدارس مراكزَ إيواء، واستمرارية التعليم",
            },
          },
          {
            title: { en: "Ministry of Public Health", ar: "وزارة الصحة العامة" },
            sub: {
              en: "Firas Abiad (Minister) - hospitals, primary health-care centres",
              ar: "فراس الأبيض (الوزير) - المستشفيات ومراكز الرعاية الصحية الأولية",
            },
          },
          {
            title: { en: "Ministry of Agriculture", ar: "وزارة الزراعة" },
            sub: {
              en: "Abbas Hajj Hassan (Minister) - farms, livestock, rural needs",
              ar: "عباس الحاج حسن (الوزير) - المزارع والثروة الحيوانية وحاجات الريف",
            },
          },
          {
            title: { en: "Ministry of Culture / DGA", ar: "وزارة الثقافة / المديرية العامة للآثار" },
            sub: {
              en: "Mohammad Wissam Mortada (Minister) - heritage and cultural sites",
              ar: "محمد وسام المرتضى (الوزير) - التراث والمواقع الثقافية",
            },
          },
          {
            title: {
              en: "LAF / LMAC, Civil Defense, ISF",
              ar: "الجيش اللبناني / المركز اللبناني للألغام، والدفاع المدني، وقوى الأمن الداخلي",
            },
            sub: {
              en: "Engineering units, clearance support, search and rescue, security",
              ar: "وحدات هندسية، ودعم التطهير، والبحث والإنقاذ، والأمن",
            },
          },
          {
            tone: "community",
            title: {
              en: "Lebanese Red Cross, ICRC, NGOs, volunteers",
              ar: "الصليب الأحمر اللبناني، واللجنة الدولية للصليب الأحمر، والجمعيات، والمتطوعون",
            },
            sub: {
              en: "First aid, medical transport, relief; community substitution across the chain",
              ar: "الإسعاف الأولي والنقل الطبي والإغاثة؛ واستبدال المجتمع على امتداد السلسلة",
            },
          },
        ],
      },
    ],
  },
  {
    n: 4,
    title: { en: "Relief and reconstruction bridge", ar: "الجسر بين الإغاثة وإعادة الإعمار" },
    rows: [
      {
        cols: "sm:grid-cols-2 lg:grid-cols-4",
        boxes: [
          {
            title: { en: "Higher Relief Commission", ar: "الهيئة العليا للإغاثة" },
            sub: {
              en: "Maj. Gen. Mohammad Khair (Secretary-General) - damage registration and compensation claims",
              ar: "اللواء محمد خير (الأمين العام) - تسجيل الأضرار وطلبات التعويض",
            },
          },
          {
            title: { en: "Council of the South", ar: "مجلس الجنوب" },
            sub: {
              en: "Hashem Haidar (Head) - southern communities, rubble removal, damage claims",
              ar: "هاشم حيدر (الرئيس) - البلدات الجنوبية، ورفع الأنقاض، وطلبات الأضرار",
            },
          },
          {
            title: { en: "CDR (preparatory)", ar: "مجلس الإنماء والإعمار (تحضيري)" },
            sub: {
              en: "Prepared the recovery pipeline that became LEAP in 2025-26",
              ar: "أعدّ مسار التعافي الذي صار مشروع LEAP في 2025-26",
            },
          },
          {
            tone: "international",
            title: { en: "UN agencies and partners", ar: "وكالات الأمم المتحدة وشركاؤها" },
            sub: {
              en: "UNDP, IOM DTM, UNICEF, FAO, WFP, WHO, OCHA - assessment, relief, services",
              ar: "البرنامج الإنمائي، والمنظمة الدولية للهجرة، واليونيسف، والفاو، وبرنامج الأغذية، ومنظمة الصحة، ومكتب تنسيق الشؤون الإنسانية - تقييم وإغاثة وخدمات",
            },
          },
        ],
      },
    ],
  },
  {
    n: 5,
    title: { en: "Local response chain", ar: "سلسلة الاستجابة المحلية" },
    chain: [
      {
        title: { en: "Municipality / local committee", ar: "البلدية / اللجنة المحلية" },
        sub: {
          en: "Report local damage, blocked roads, outages, shelter needs",
          ar: "الإبلاغ عن الأضرار والطرق المقطوعة والانقطاعات وحاجات الإيواء",
        },
      },
      {
        title: { en: "Union of municipalities / qaimmaqam", ar: "اتحاد البلديات / القائمقام" },
        sub: { en: "Consolidate local reports", ar: "تجميع التقارير المحلية" },
      },
      {
        title: { en: "Governorate (governor & DRM unit)", ar: "المحافظة (المحافظ ووحدة إدارة الكوارث)" },
        sub: { en: "Validate, prioritise, consolidate", ar: "التثبّت وترتيب الأولويات والتجميع" },
      },
      {
        title: { en: "National Operations Room", ar: "غرفة العمليات الوطنية" },
        sub: { en: "Receive and analyse in real time", ar: "التلقّي والتحليل آنياً" },
      },
      {
        title: { en: "Line ministries / operators", ar: "الوزارات المعنية / المؤسسات المشغّلة" },
        sub: {
          en: "Act on priorities: roads, power, water, shelters",
          ar: "العمل على الأولويات: الطرق والكهرباء والمياه ومراكز الإيواء",
        },
      },
      {
        title: { en: "Sector assessments and RDNA", ar: "التقييمات القطاعية والتقييم السريع" },
        sub: {
          en: "Convert damage into an official baseline",
          ar: "تحويل الأضرار إلى خط أساس رسمي",
        },
      },
    ],
  },
];

const KEY_FIGURES_2024 = {
  title: { en: "Key figures (RDNA, published March 2025)", ar: "أرقام أساسية (التقييم السريع، نُشر في آذار 2025)" },
  items: [
    {
      en: "Total economic cost: US$14 billion (US$6.8B physical damage, US$7.2B economic losses)",
      ar: "الكلفة الاقتصادية الإجمالية: 14 مليار دولار (6.8 مليارات أضراراً مادية، و7.2 مليارات خسائر اقتصادية)",
    },
    {
      en: "Recovery and reconstruction needs: about US$11 billion",
      ar: "احتياجات التعافي وإعادة الإعمار: نحو 11 مليار دولار",
    },
    {
      // The RDNA states a range, and the indicator card on this same page
      // prints it as one. The 4 was this site's own midpoint.
      en: "Public-financing share of needs: about US$3-5 billion",
      ar: "حصة التمويل العام من الاحتياجات: نحو 3-5 مليارات دولار",
    },
  ],
};

const MISSING_2024: BoxSpec = {
  tone: "alert",
  title: {
    en: "Missing in 2024: an integrated, financed national chain",
    ar: "الغائب في 2024: سلسلة وطنية متكاملة وممولة",
  },
  sub: {
    en: "Data → finance → compensation → procurement → implementation → oversight. Coordination worked; there was no financed delivery vehicle behind it.",
    ar: "معطيات ← تمويل ← تعويض ← شراء ← تنفيذ ← رقابة. التنسيق عمل؛ ولم تكن خلفه أداة تنفيذ ممولة.",
  },
};

function Map2024({ locale }: { locale: Locale }) {
  const NAVY = "#143F35";
  return (
    <figure className="card">
      <figcaption className="border-b-2 border-navy pb-3">
        <h3 className="text-h3 font-bold text-navy">
          {say(locale, HEAD_2024.title)}
        </h3>
        <p className="mt-1 text-body text-text-secondary">
          {say(locale, HEAD_2024.sub)}
        </p>
      </figcaption>

      <Bands bands={BANDS_2024} accent={NAVY} locale={locale} />

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        <div className="rounded-md border-2 border-[#C6D2DF] bg-[#F1F4F8] px-3 py-2">
          <p className="text-meta font-bold text-navy">
            {say(locale, KEY_FIGURES_2024.title)}
          </p>
          <ul className="mt-1 space-y-0.5 text-micro text-text-secondary">
            {KEY_FIGURES_2024.items.map((i) => (
              <li key={i.en}>· {say(locale, i)}</li>
            ))}
          </ul>
        </div>
        <Box spec={MISSING_2024} locale={locale} />
      </div>
    </figure>
  );
}

/* --------------------------------- 2026 ---------------------------------- */

const HEAD_2026 = {
  title: {
    en: "2026 post-war reconstruction - debris removal and damage assessment",
    ar: "إعادة إعمار ما بعد حرب 2026 - رفع الركام وتقييم الأضرار",
  },
  sub: {
    en: "Strategic direction · local reporting · procurement · monitoring · service restoration, under one government running two chains at once.",
    ar: "توجيه استراتيجي · إبلاغ محلي · شراء · مراقبة · استعادة الخدمات، تحت حكومة واحدة تدير سلسلتين في آن.",
  },
};

const BANDS_2026: BandSpec[] = [
  {
    n: 1,
    title: { en: "National command level", ar: "مستوى القيادة الوطنية" },
    rows: [
      {
        cols: "lg:grid-cols-4",
        boxes: [
          {
            tone: "command",
            title: { en: "Presidency", ar: "رئاسة الجمهورية" },
            sub: { en: "Joseph Aoun, President of the Republic", ar: "جوزاف عون، رئيس الجمهورية" },
          },
          {
            tone: "command",
            title: { en: "Prime Minister / Council of Ministers", ar: "رئاسة مجلس الوزراء ومجلس الوزراء" },
            sub: {
              en: "Nawaf Salam (Prime Minister) - approves priorities, policies and coordination",
              ar: "نواف سلام (رئيس مجلس الوزراء) - يقرّ الأولويات والسياسات والتنسيق",
            },
          },
          {
            tone: "state",
            title: { en: "Deputy Prime Minister", ar: "نائب رئيس مجلس الوزراء" },
            sub: { en: "Tarek Mitri - supports cabinet coordination", ar: "طارق متري - يدعم التنسيق الحكومي" },
          },
          {
            tone: "state",
            title: { en: "PMO / Grand Serail", ar: "رئاسة الحكومة / السراي الكبير" },
            sub: {
              en: "Strategic guidance for LEAP and reconstruction",
              ar: "توجيه استراتيجي لمشروع LEAP ولإعادة الإعمار",
            },
          },
        ],
      },
      {
        cols: "lg:grid-cols-2",
        boxes: [
          {
            tone: "state",
            title: { en: "National DRM Unit (PCM)", ar: "الوحدة الوطنية لإدارة مخاطر الكوارث (رئاسة الحكومة)" },
            sub: {
              en: "National disaster-risk-management coordination",
              ar: "تنسيق وطني لإدارة مخاطر الكوارث",
            },
          },
          {
            tone: "state",
            title: {
              en: "National Emergency Operations Room (NEOR)",
              ar: "غرفة العمليات الوطنية للطوارئ",
            },
            sub: {
              en: "PCM / DRM / MoSA - activated 2 March 2026; receives real-time reports from governorates and municipalities",
              ar: "رئاسة الحكومة / إدارة الكوارث / الشؤون الاجتماعية - فُعّلت في 2 آذار 2026؛ وتتلقّى تقارير آنية من المحافظات والبلديات",
            },
          },
        ],
      },
    ],
  },
  {
    n: 2,
    title: {
      en: "Local administration and reporting layer",
      ar: "طبقة الإدارة المحلية والإبلاغ",
    },
    rows: [
      {
        cols: "lg:grid-cols-5",
        boxes: [
          {
            title: { en: "Ministry of Social Affairs", ar: "وزارة الشؤون الاجتماعية" },
            sub: {
              en: "Haneen Sayed (Minister); Ola Boutros (LRP General Supervisor)",
              ar: "حنين السيد (الوزيرة)؛ علا بطرس (المشرفة العامة على خطة الاستجابة)",
            },
            bullets: [
              { en: "Displacement management", ar: "إدارة النزوح" },
              { en: "Shelters and social protection", ar: "مراكز الإيواء والحماية الاجتماعية" },
              {
                en: "Sole government liaison to the Humanitarian Country Team",
                ar: "حلقة الوصل الحكومية الوحيدة مع الفريق القطري الإنساني",
              },
            ],
          },
          {
            title: { en: "Ministry of Interior and Municipalities", ar: "وزارة الداخلية والبلديات" },
            sub: {
              en: "Ahmad al-Hajjar (Minister) - governorate coordination, municipal oversight",
              ar: "أحمد الحجار (الوزير) - تنسيق المحافظات ومتابعة البلديات",
            },
          },
          {
            title: { en: "Governorates", ar: "المحافظات" },
            sub: {
              en: "Lead sub-national coordination and prioritisation",
              ar: "تقود التنسيق وترتيب الأولويات دون المستوى الوطني",
            },
          },
          {
            tone: "delivery",
            title: { en: "Municipalities and cadastres", ar: "البلديات والعقارات" },
            sub: {
              en: "Report local needs: roads, rubble, water, electricity, shelters",
              ar: "الإبلاغ عن الحاجات المحلية: الطرق والأنقاض والمياه والكهرباء والإيواء",
            },
          },
          {
            tone: "international",
            title: { en: "Partners supporting the response", ar: "شركاء يدعمون الاستجابة" },
            sub: {
              en: "IOM DTM (displacement tracking), WFP, UNICEF, WHO, UNDP, OCHA and NGO partners",
              ar: "المنظمة الدولية للهجرة (تتبّع النزوح)، وبرنامج الأغذية، واليونيسف، ومنظمة الصحة، والبرنامج الإنمائي، ومكتب تنسيق الشؤون الإنسانية، والجمعيات الشريكة",
            },
          },
        ],
      },
    ],
    note: {
      en: "Shelter and displacement figures in the printed version (about 136,000 displaced people in collective shelters; 682 open shelters) come from a Ministry of Social Affairs presentation dated 16 April 2026. They are reported figures, not confirmed here, and the printed versions disagree with each other on the shelter count.",
      ar: "أرقام الإيواء والنزوح في النسخة المطبوعة (نحو 136,000 نازح في مراكز إيواء جماعي؛ و682 مركزاً مفتوحاً) مأخوذة من عرض لوزارة الشؤون الاجتماعية بتاريخ 16 نيسان 2026. وهي أرقام مُبلَّغ عنها، غير مؤكَّدة هنا، والنسخ المطبوعة تختلف فيما بينها على عدد مراكز الإيواء.",
    },
  },
  {
    n: 3,
    title: {
      en: "LEAP / CDR reconstruction structure (US$1 billion framework)",
      ar: "بنية إعادة الإعمار LEAP / مجلس الإنماء والإعمار (إطار بمليار دولار)",
    },
    rows: [
      {
        cols: "lg:grid-cols-6",
        boxes: [
          {
            tone: "international",
            title: { en: "LEAP (World Bank)", ar: "مشروع LEAP (البنك الدولي)" },
            sub: {
              en: "US$1 billion scalable framework; US$250M initial financing; US$750M financing gap; Loan 9841-LB",
              ar: "إطار قابل للتوسّع بمليار دولار؛ و250 مليوناً تمويلاً أولياً؛ وفجوة تمويل بـ750 مليوناً؛ القرض 9841-LB",
            },
          },
          {
            tone: "state",
            title: { en: "CDR", ar: "مجلس الإنماء والإعمار" },
            sub: {
              en: "Council for Development and Reconstruction - implementing agency",
              ar: "الجهة المنفِّذة",
            },
          },
          {
            tone: "state",
            title: { en: "CDR PMU", ar: "وحدة إدارة المشروع في المجلس" },
            sub: {
              en: "Procurement, safeguards, finance, reporting and grievance redress",
              ar: "الشراء والضمانات والتمويل والإبلاغ ومعالجة التظلّمات",
            },
          },
          {
            title: { en: "Ministry of Finance", ar: "وزارة المالية" },
            sub: {
              en: "Yassine Jaber (Minister) - financial oversight and budget coordination",
              ar: "ياسين جابر (الوزير) - الرقابة المالية وتنسيق الموازنة",
            },
          },
          {
            title: { en: "Line ministries", ar: "الوزارات المعنية" },
            sub: {
              en: "MPWT, MoEW, MoE, MoSA, MoIM, MoPH, MoA - technical oversight",
              ar: "الأشغال، والطاقة والمياه، والبيئة، والشؤون الاجتماعية، والداخلية، والصحة، والزراعة - متابعة فنية",
            },
          },
          {
            title: { en: "Public operators", ar: "المؤسسات العامة المشغّلة" },
            sub: {
              en: "EDL, water establishments, LRA - operational execution",
              ar: "كهرباء لبنان، ومؤسسات المياه، ومصلحة الليطاني - التنفيذ التشغيلي",
            },
          },
        ],
      },
    ],
  },
  {
    n: 4,
    title: {
      en: "CDR procurement and technical packages, portal checked 17 July 2026",
      ar: "حزم الشراء والحزم الفنية في المجلس، بوابة الشراء بتاريخ 17 تموز 2026",
    },
    rows: [
      {
        cols: "sm:grid-cols-2 lg:grid-cols-3",
        boxes: [
          {
            tone: "gate",
            title: {
              en: "#1095 - Rubble management at a quarry site",
              ar: "‏#1095 - إدارة الأنقاض في موقع مقلع",
            },
            sub: {
              en: "LEAP-CS-TA-02. Engineering and consulting services. Published 12 May 2026, deadline 7 July 2026. No award displayed.",
              ar: "LEAP-CS-TA-02. خدمات هندسية واستشارية. نُشرت في 12 أيار 2026، والمهلة 7 تموز 2026. ولا إرساء معروض.",
            },
          },
          {
            tone: "gate",
            title: {
              en: "#1082 - Supervision of road clearing and restoration",
              ar: "‏#1082 - الإشراف على فتح الطرق وإعادتها",
            },
            sub: {
              en: "LEAP-CS-SUP-01, covering Marjeyoun, Sour and Bent Jbeil. Published 27 February 2026, deadline 29 April 2026. Under evaluation.",
              ar: "LEAP-CS-SUP-01، وتغطي مرجعيون وصور وبنت جبيل. نُشرت في 27 شباط 2026، والمهلة 29 نيسان 2026. قيد التقييم.",
            },
          },
          {
            tone: "gate",
            title: {
              en: "#1096 - Third-Party Monitoring Agent (TPMA)",
              ar: "‏#1096 - جهة المراقبة المستقلة",
            },
            sub: {
              en: "LEAP-CS-TPMA-01. Monitoring of works, safeguards and results. Published 13 May 2026, deadline 16 July 2026; under procurement, not operating.",
              ar: "LEAP-CS-TPMA-01. مراقبة الأشغال والضمانات والنتائج. نُشرت في 13 أيار 2026، والمهلة 16 تموز 2026؛ قيد الشراء، غير عاملة.",
            },
          },
          {
            title: {
              en: "LEAP-CS-TA-00 - Technical assistance to the PMU",
              ar: "LEAP-CS-TA-00 - مساعدة فنية لوحدة إدارة المشروع",
            },
            sub: {
              en: "Capacity building and institutional strengthening",
              ar: "بناء القدرات وتعزيز المؤسسات",
            },
          },
          {
            title: {
              en: "Grievance Redress Mechanism (GRM)",
              ar: "آلية معالجة التظلّمات",
            },
            sub: {
              en: "Published with contact points and investigation timelines; largely not yet operational",
              ar: "نُشرت بنقاط اتصال ومهل للتحقيق؛ وغير عاملة في معظمها بعد",
            },
          },
          {
            tone: "alert",
            title: {
              en: "Works contracts awarded at the latest review: zero",
              ar: "عقود الأشغال المُرساة عند آخر مراجعة: صفر",
            },
            sub: {
              en: "Procurement under way is a process milestone. No works contract, no confirmed completed output and no confirmed compensation payment at the latest review.",
              ar: "الشراء الجاري محطة إجرائية. لا عقد أشغال، ولا مخرج مكتمل مؤكَّد، ولا دفعة تعويض مؤكَّدة عند آخر مراجعة.",
            },
          },
        ],
      },
    ],
  },
  {
    n: 5,
    title: {
      en: "Line ministries and public operators - implementation",
      ar: "الوزارات المعنية والمؤسسات العامة - التنفيذ",
    },
    rows: [
      {
        cols: "sm:grid-cols-2 lg:grid-cols-4",
        boxes: [
          {
            title: { en: "MPWT - Fayez Rasamny", ar: "الأشغال العامة والنقل - فايز رسامني" },
            sub: {
              en: "Roads, bridges, public works, access restoration",
              ar: "الطرق والجسور والأشغال العامة وإعادة فتح الوصول",
            },
          },
          {
            title: { en: "MoEW - Joe Saddi", ar: "الطاقة والمياه - جو صدي" },
            sub: {
              en: "Electricity, water and irrigation policy",
              ar: "سياسات الكهرباء والمياه والري",
            },
          },
          {
            title: { en: "EDL", ar: "مؤسسة كهرباء لبنان" },
            sub: { en: "Generation, transmission and distribution", ar: "التوليد والنقل والتوزيع" },
          },
          {
            title: { en: "Water establishments", ar: "مؤسسات المياه" },
            sub: {
              en: "SLWE, BWE, BMLWE - water supply and wastewater",
              ar: "الجنوب، والبقاع، وبيروت وجبل لبنان - التزويد بالمياه والصرف الصحي",
            },
          },
          {
            title: { en: "Litani River Authority", ar: "المصلحة الوطنية لنهر الليطاني" },
            sub: { en: "Irrigation and water infrastructure", ar: "الري والبنى المائية" },
          },
          {
            title: { en: "MoE - Tamara El-Zein", ar: "البيئة - تمارا الزين" },
            sub: {
              en: "Environment, rubble and pollution safeguards",
              ar: "البيئة والأنقاض وضمانات التلوّث",
            },
          },
          {
            title: { en: "MoPH - Rakan Nassereddine", ar: "الصحة العامة - ركان ناصر الدين" },
            sub: {
              en: "Health facilities, primary health-care centres",
              ar: "المرافق الصحية ومراكز الرعاية الأولية",
            },
          },
          {
            title: { en: "MoA - Nizar Hani", ar: "الزراعة - نزار هاني" },
            sub: {
              en: "Agriculture, livestock, rural recovery",
              ar: "الزراعة والثروة الحيوانية وتعافي الريف",
            },
          },
          {
            title: {
              en: "Ministry of Culture / DGA - Ghassan Salamé",
              ar: "الثقافة / المديرية العامة للآثار - غسان سلامة",
            },
            sub: { en: "Heritage and cultural assets", ar: "التراث والأصول الثقافية" },
          },
          {
            title: { en: "LAF (engineering)", ar: "الجيش اللبناني (الهندسة)" },
            sub: { en: "Clearance and engineering support", ar: "التطهير والدعم الهندسي" },
          },
          {
            title: {
              en: "Civil Defense and Lebanese Red Cross",
              ar: "الدفاع المدني والصليب الأحمر اللبناني",
            },
            sub: {
              en: "Search and rescue, medical response, relief",
              ar: "البحث والإنقاذ والاستجابة الطبية والإغاثة",
            },
          },
          {
            title: { en: "ISF - Maj. Gen. Raed Abdallah", ar: "قوى الأمن الداخلي - اللواء رائد عبدالله" },
            sub: { en: "Security, traffic and public order", ar: "الأمن والسير والنظام العام" },
          },
        ],
      },
    ],
  },
  {
    n: 6,
    title: { en: "Monitoring and accountability", ar: "المراقبة والمساءلة" },
    rows: [
      {
        cols: "sm:grid-cols-2 lg:grid-cols-3",
        boxes: [
          {
            title: {
              en: "UNDP + CNRS-L damage assessments (2026)",
              ar: "تقييمات الأضرار للبرنامج الإنمائي والمجلس الوطني للبحوث (2026)",
            },
            sub: {
              en: "Beirut & Mount Lebanon: US$365.0M; 146 buildings destroyed, 264 partially damaged; 648,942 m³ of debris. South of the Litani: US$1.384B; 11,095 buildings completely destroyed; 3.1 million m³ of debris.",
              ar: "بيروت وجبل لبنان: 365.0 مليون دولار؛ و146 مبنى مدمَّراً، و264 متضرراً جزئياً؛ و648,942 م³ من الركام. جنوب الليطاني: 1.384 مليار دولار؛ و11,095 مبنى مدمَّراً كلياً؛ و3.1 ملايين م³ من الركام.",
            },
          },
          {
            title: { en: "CNRS-L remote sensing", ar: "الاستشعار عن بُعد لدى المجلس الوطني للبحوث" },
            sub: {
              en: "Geospatial monitoring, change detection against an October 2025 baseline",
              ar: "رصد جغرافي مكاني، وكشف التغيّر قياساً إلى خط أساس تشرين الأول 2025",
            },
          },
          {
            tone: "gate",
            title: { en: "TPMA - independent confirmation", ar: "جهة المراقبة المستقلة - تثبيت مستقل" },
            sub: {
              en: "Specified for works and safeguards; under procurement, not operating",
              ar: "محدَّدة للأشغال والضمانات؛ قيد الشراء، غير عاملة",
            },
          },
          {
            title: { en: "CDR M&E unit", ar: "وحدة المتابعة والتقييم في المجلس" },
            sub: { en: "Results framework and progress reporting", ar: "إطار النتائج وتقارير التقدّم" },
          },
          {
            tone: "international",
            title: { en: "World Bank supervision", ar: "إشراف البنك الدولي" },
            sub: {
              en: "Safeguards, fiduciary rules, technical oversight, Lender's Engineer (under procurement)",
              ar: "الضمانات والقواعد المالية والمتابعة الفنية، ومهندس المُقرِض (قيد الشراء)",
            },
          },
          {
            tone: "community",
            title: { en: "Community feedback", ar: "ملاحظات الأهالي" },
            sub: {
              en: "Engagement and complaints handling through the GRM",
              ar: "التفاعل ومعالجة الشكاوى عبر آلية التظلّمات",
            },
          },
        ],
      },
    ],
  },
  {
    n: 7,
    title: { en: "Local implementation chain", ar: "سلسلة التنفيذ المحلية" },
    chain: [
      {
        title: { en: "Municipality / cadastre", ar: "البلدية / العقار" },
        sub: {
          en: "Report needs: rubble, roads, water, electricity, shelters",
          ar: "الإبلاغ عن الحاجات: الأنقاض والطرق والمياه والكهرباء والإيواء",
        },
      },
      {
        title: { en: "Union of municipalities / qaimmaqam", ar: "اتحاد البلديات / القائمقام" },
        sub: {
          en: "Consolidate and prioritise local needs",
          ar: "تجميع الحاجات المحلية وترتيب أولوياتها",
        },
      },
      {
        title: { en: "Governorate / DRM", ar: "المحافظة / إدارة الكوارث" },
        sub: { en: "Validate, rank and prioritise", ar: "التثبّت والترتيب وتحديد الأولوية" },
      },
      {
        title: {
          en: "PMO / Council of Ministers / LEAP",
          ar: "رئاسة الحكومة / مجلس الوزراء / LEAP",
        },
        sub: { en: "Approve priorities and allocate funding", ar: "إقرار الأولويات وتخصيص التمويل" },
      },
      {
        title: { en: "CDR PMU", ar: "وحدة إدارة المشروع في المجلس" },
        sub: {
          en: "Launch tenders, manage contracts and consultants",
          ar: "إطلاق المناقصات وإدارة العقود والاستشاريين",
        },
      },
      {
        title: { en: "Contractors / operators", ar: "المتعهدون / المشغّلون" },
        sub: { en: "Implement works on the ground", ar: "تنفيذ الأشغال على الأرض" },
      },
      {
        title: { en: "TPMA / CDR M&E / World Bank", ar: "جهة المراقبة / المتابعة والتقييم / البنك الدولي" },
        sub: { en: "Monitor, check and report results", ar: "المراقبة والفحص والإبلاغ عن النتائج" },
      },
      {
        title: { en: "Communities and beneficiaries", ar: "الأهالي والمستفيدون" },
        sub: { en: "Provide feedback and grievances", ar: "إبداء الملاحظات وتقديم التظلّمات" },
      },
    ],
  },
];

const TAIL_2026: BoxSpec[] = [
  {
    tone: "international",
    title: { en: "Funding and status", ar: "التمويل والوضع" },
    sub: {
      en: "US$250M initial World Bank financing (25% of the framework); US$750M financing gap (75%); US$4.13M disbursed (1.65% of the loan) at 29 June 2026",
      ar: "250 مليون دولار تمويلاً أولياً من البنك الدولي (25% من الإطار)؛ وفجوة تمويل بـ750 مليوناً (75%)؛ و4.13 ملايين دولار دُفعت (1.65% من القرض) حتى 29 حزيران 2026",
    },
  },
  {
    tone: "gate",
    title: { en: "Security and access gate", ar: "بوابة الأمن والوصول" },
    sub: {
      en: "Lebanese Army ERW/UXO clearance is a mandatory prerequisite for all works; unexploded ordnance remains a critical risk",
      ar: "تطهير الجيش اللبناني للذخائر غير المنفجرة شرط مسبق إلزامي لكل الأشغال؛ والذخائر غير المنفجرة تبقى خطراً حاسماً",
    },
  },
  {
    title: { en: "Procurement and transparency", ar: "الشراء والشفافية" },
    sub: {
      en: "CDR procurement portal, World Bank procurement rules, TPMA and supervision firms, independent checks and audits, GRM, community consultation",
      ar: "بوابة الشراء في المجلس، وقواعد الشراء لدى البنك الدولي، وجهة المراقبة وشركات الإشراف، والفحوص والتدقيقات المستقلة، وآلية التظلّمات، والتشاور مع الأهالي",
    },
  },
  {
    title: { en: "Service restoration chains", ar: "سلاسل استعادة الخدمات" },
    sub: {
      en: "Roads and bridges, debris management, electricity, drinking water and wastewater, telecommunications, health facilities, schools and public buildings, heritage sites",
      ar: "الطرق والجسور، وإدارة الركام، والكهرباء، ومياه الشفة والصرف الصحي، والاتصالات، والمرافق الصحية، والمدارس والأبنية العامة، والمواقع التراثية",
    },
  },
];

const GAP_2026: L = {
  en: "Gap in 2026: LEAP's scope is limited to 2023-24 damage. No financed compensation or reconstruction instrument for 2026-war damage had been identified at the latest review.",
  ar: "الفجوة في 2026: نطاق LEAP محصور بأضرار 2023-24. ولم تُحدَّد عند آخر مراجعة أي أداة ممولة للتعويض أو لإعادة الإعمار عن أضرار حرب 2026.",
};

function Map2026({ locale }: { locale: Locale }) {
  const GREEN = "#2F6B4F";
  return (
    <figure className="card">
      <figcaption className="border-b-2 border-[#2F6B4F] pb-3">
        <h3 className="text-h3 font-bold text-[#24543E]">
          {say(locale, HEAD_2026.title)}
        </h3>
        <p className="mt-1 text-body text-text-secondary">
          {say(locale, HEAD_2026.sub)}
        </p>
      </figcaption>

      <Bands bands={BANDS_2026} accent={GREEN} locale={locale} />

      <div className="mt-4 grid gap-2 lg:grid-cols-4">
        {TAIL_2026.map((b) => (
          <Box key={b.title.en} spec={b} locale={locale} />
        ))}
      </div>

      <p className="mt-3 rounded-md border-2 border-rust bg-[#FBF3F0] px-4 py-2.5 text-center text-meta font-bold leading-relaxed text-rust">
        {say(locale, GAP_2026)}
      </p>
    </figure>
  );
}

export default function InstitutionalStructures({
  locale = "en",
}: { locale?: Locale } = {}) {
  return (
    <div className="space-y-6">
      <Map2024 locale={locale} />
      <Map2026 locale={locale} />
    </div>
  );
}
