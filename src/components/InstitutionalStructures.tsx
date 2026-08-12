import type { ReactNode } from "react";

/**
 * The two institutional maps - 2024 emergency response and 2026
 * reconstruction chain - rebuilt for the web from the source diagrams
 * and checked line by line against the tracking. Corrections made
 * during that check are listed at the foot of each map, so a reader can
 * see exactly where the printed versions and the data differ.
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
  command: "bg-[#173B63] text-white border-transparent",
  state: "bg-[#2E74B5] text-white border-transparent",
  stateLight: "bg-white text-[color:var(--color-text)] border-[#9FB4CB]",
  delivery: "bg-[#F1F4F8] text-[color:var(--color-text)] border-[#C6D2DF]",
  international: "bg-[#1B8295] text-white border-transparent",
  community: "bg-[#A34F7C] text-white border-transparent",
  gate: "bg-[#FBF0D5] text-[#6b4e00] border-[#D69600]",
  alert: "bg-[#FBF3F0] text-[color:var(--color-rust)] border-[color:var(--color-rust)]",
};

function Box({
  tone = "stateLight",
  title,
  sub,
  bullets,
}: {
  tone?: Tone;
  title: string;
  sub?: string;
  bullets?: string[];
}) {
  const muted =
    tone === "command" || tone === "state" || tone === "international" || tone === "community";
  return (
    <div className={`rounded-md border-2 px-3 py-2 ${TONE_BOX[tone]}`}>
      <p className="text-[12px] font-bold leading-snug">{title}</p>
      {sub ? (
        <p className={`mt-0.5 text-[11px] leading-snug ${muted ? "text-white/80" : "text-[color:var(--color-text-secondary)]"}`}>
          {sub}
        </p>
      ) : null}
      {bullets && bullets.length > 0 ? (
        <ul className={`mt-1 space-y-0.5 text-[11px] leading-snug ${muted ? "text-white/85" : "text-[color:var(--color-text-secondary)]"}`}>
          {bullets.map((b) => (
            <li key={b} className="flex gap-1.5">
              <span aria-hidden>·</span>
              <span>{b}</span>
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
      <h4 className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-white" style={{ background: accent }}>
        <span className="grid h-4 w-4 place-items-center rounded-full bg-white/25 text-[10px]">
          {n}
        </span>
        {title}
      </h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Chain({ steps }: { steps: { title: string; sub?: string }[] }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      {steps.map((s, i) => (
        <li key={s.title} className="relative">
          <div className="h-full rounded-md border-2 border-[#C6D2DF] bg-white px-2.5 py-2">
            <p className="text-[11.5px] font-bold leading-snug text-[color:var(--color-navy)]">
              <span className="text-[color:var(--color-text-secondary)]">{i + 1}. </span>
              {s.title}
            </p>
            {s.sub ? (
              <p className="mt-0.5 text-[10.5px] leading-snug text-[color:var(--color-text-secondary)]">
                {s.sub}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Corrections({ items }: { items: string[] }) {
  return (
    <details className="mt-5 rounded-md border border-dashed border-[color:var(--color-border)] bg-[#FAFBFC] p-3">
      <summary className="cursor-pointer text-[12px] font-bold text-[color:var(--color-navy)]">
        Checked against the analysis - {items.length} corrections applied
      </summary>
      <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
        {items.map((c) => (
          <li key={c.slice(0, 30)} className="flex gap-2">
            <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-rust)]" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* --------------------------------- 2024 ---------------------------------- */

function Map2024() {
  const NAVY = "#173B63";
  return (
    <figure className="card p-4 sm:p-6">
      <figcaption className="border-b-2 border-[color:var(--color-navy)] pb-3">
        <h3 className="text-lg font-bold text-[color:var(--color-navy)] sm:text-xl">
          2024 war response - emergency coordination and damage baseline
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Emergency response chain · damage and needs baseline · basic service
          continuity · the foundation later used for reconstruction planning.
        </p>
      </figcaption>

      <Band n={1} title="National command and coordination" accent={NAVY}>
        <div className="grid gap-2 lg:grid-cols-4">
          <Box
            tone="alert"
            title="Presidency of the Republic: vacant"
            sub="No head of state throughout 2024; the office was filled only in January 2025."
          />
          <Box
            tone="command"
            title="Caretaker PM / PCM & Council of Ministers"
            sub="Najib Mikati (Caretaker PM); Mahmoud Makkiya (SG, Council of Ministers)"
          />
          <Box
            tone="state"
            title="Government Emergency Committee"
            sub="Coordinated by Nasser Yassin, Minister of Environment"
          />
          <Box
            tone="state"
            title="DRM Unit (PCM) + National Operations Room"
            sub="Real-time coordination hub receiving governorate and ministry reports"
          />
        </div>
        <div className="mt-2 grid gap-2 lg:grid-cols-3">
          <Box
            tone="stateLight"
            title="Supreme Council of Defense"
            sub="Maj. Gen. Mohammad al-Mustafa (Secretary-General) - security and access coordination"
          />
          <Box
            tone="stateLight"
            title="Ministry of Interior and Municipalities"
            sub="Bassam Mawlawi (Minister) - governors, municipalities, internal security"
          />
          <Box
            tone="stateLight"
            title="Ministry of Finance"
            sub="Youssef Khalil (Minister) - fiscal space and donor relations"
          />
        </div>
      </Band>

      <Band n={2} title="Damage assessment and data (baseline building)" accent={NAVY}>
        <div className="grid gap-2 lg:grid-cols-5">
          <Box
            tone="international"
            title="World Bank RDNA"
            sub="Requested by the government; national damage and needs across ten sectors, 8 Oct 2023 - 20 Dec 2024"
          />
          <Box tone="stateLight" title="CNRS-L" sub="Satellite imagery, remote sensing, damage mapping and analytics" />
          <Box tone="international" title="UNDP local-authority assessment" sub="Working through municipalities and unions to assess damage" />
          <Box tone="delivery" title="Municipalities and unions" bullets={["Damage reporting", "Blocked roads", "Rubble and debris", "Electricity and water outages"]} />
          <Box tone="delivery" title="Governorates (DRM units)" bullets={["Validate and consolidate", "Prioritise needs", "Forward to national systems"]} />
        </div>
        <p className="mt-2 rounded-md bg-[#EEF2F7] px-3 py-1.5 text-center text-[11.5px] font-semibold text-[color:var(--color-navy)]">
          Data flows upward: the national assessment set priorities for reconstruction planning that had no financing attached in 2024.
        </p>
      </Band>

      <Band n={3} title="Core implementation entities" accent={NAVY}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Box tone="stateLight" title="Ministry of Public Works and Transport" sub="Ali Hamieh (Minister) - roads, access opening, emergency repairs" />
          <Box tone="stateLight" title="Ministry of Energy and Water" sub="Walid Fayad (Minister) - policy, sector oversight, prioritisation" />
          <Box tone="stateLight" title="Électricité du Liban (EDL)" sub="Feeders, transformers, substations; outage management" />
          <Box tone="stateLight" title="Water establishments" sub="South Lebanon, Bekaa, Beirut & Mount Lebanon, North Lebanon (SLWE, BWE, BMLWE, NLWE) + Litani River Authority" />
          <Box tone="stateLight" title="Ministry of Environment" sub="Nasser Yassin (Minister) - debris and rubble, environmental safeguards" />
          <Box tone="stateLight" title="Ministry of Social Affairs" sub="Hector Hajjar (Minister) - shelters, displaced people, social support" />
          <Box tone="stateLight" title="Ministry of Education and Higher Education" sub="Abbas Halabi (Minister) - schools as shelters, education continuity" />
          <Box tone="stateLight" title="Ministry of Public Health" sub="Firas Abiad (Minister) - hospitals, primary health-care centres" />
          <Box tone="stateLight" title="Ministry of Agriculture" sub="Abbas Hajj Hassan (Minister) - farms, livestock, rural needs" />
          <Box tone="stateLight" title="Ministry of Culture / DGA" sub="Mohammad Wissam Mortada (Minister) - heritage and cultural sites" />
          <Box tone="stateLight" title="LAF / LMAC, Civil Defense, ISF" sub="Engineering units, clearance support, search and rescue, security" />
          <Box tone="community" title="Lebanese Red Cross, ICRC, NGOs, volunteers" sub="First aid, medical transport, relief; community substitution across the chain" />
        </div>
      </Band>

      <Band n={4} title="Relief and reconstruction bridge" accent={NAVY}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Box tone="stateLight" title="Higher Relief Commission" sub="Maj. Gen. Mohammad Khair (Secretary-General) - damage registration and compensation claims" />
          <Box tone="stateLight" title="Council of the South" sub="Hashem Haidar (Head) - southern communities, rubble removal, damage claims" />
          <Box tone="stateLight" title="CDR (preparatory)" sub="Prepared the recovery pipeline that became LEAP in 2025-26" />
          <Box tone="international" title="UN agencies and partners" sub="UNDP, IOM DTM, UNICEF, FAO, WFP, WHO, OCHA - assessment, relief, services" />
        </div>
      </Band>

      <Band n={5} title="Local response chain" accent={NAVY}>
        <Chain
          steps={[
            { title: "Municipality / local committee", sub: "Report local damage, blocked roads, outages, shelter needs" },
            { title: "Union of municipalities / qaimmaqam", sub: "Consolidate local reports" },
            { title: "Governorate (governor & DRM unit)", sub: "Validate, prioritise, consolidate" },
            { title: "National Operations Room", sub: "Receive and analyse in real time" },
            { title: "Line ministries / operators", sub: "Act on priorities: roads, power, water, shelters" },
            { title: "Sector assessments and RDNA", sub: "Convert damage into an official baseline" },
          ]}
        />
      </Band>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        <div className="rounded-md border-2 border-[#C6D2DF] bg-[#F1F4F8] px-3 py-2">
          <p className="text-[12px] font-bold text-[color:var(--color-navy)]">
            Key figures (RDNA, published March 2025)
          </p>
          <ul className="mt-1 space-y-0.5 text-[11.5px] text-[color:var(--color-text-secondary)]">
            <li>· Total economic cost: US$14 billion (US$6.8B physical damage, US$7.2B economic losses)</li>
            <li>· Recovery and reconstruction needs: about US$11 billion</li>
            <li>· Public-financing share of needs: about US$4 billion</li>
          </ul>
        </div>
        <Box
          tone="alert"
          title="Missing in 2024: an integrated, financed national chain"
          sub="Data → finance → compensation → procurement → implementation → oversight. Coordination worked; there was no financed delivery vehicle behind it."
        />
      </div>

      <Corrections
        items={[
          "The printed version placed Joseph Aoun as President of the Republic in 2024. The presidency was vacant for the whole of 2024; he was elected in January 2025. Shown here as a vacancy, which is the analytical point of the 2024 map.",
          "Higher Relief Commission leadership: Maj. Gen. Mohammad Khair holds the post as Secretary-General, not the chairman named in the printed version.",
          "Council of the South: Hashem Haidar is its head, not the name printed.",
          "Individual names for UN agency heads were dropped: they are not carried here, and the institutions are what the analysis rests on.",
          "Public-financing share of needs is shown as the single figure carried here (about US$4 billion) rather than the US$3-5 billion range printed.",
        ]}
      />
    </figure>
  );
}

/* --------------------------------- 2026 ---------------------------------- */

function Map2026() {
  const GREEN = "#2F6B4F";
  return (
    <figure className="card p-4 sm:p-6">
      <figcaption className="border-b-2 border-[#2F6B4F] pb-3">
        <h3 className="text-lg font-bold text-[#24543E] sm:text-xl">
          2026 post-war reconstruction - debris removal and damage assessment
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Strategic direction · local reporting · procurement · monitoring ·
          service restoration, under one government running two chains at once.
        </p>
      </figcaption>

      <Band n={1} title="National command level" accent={GREEN}>
        <div className="grid gap-2 lg:grid-cols-4">
          <Box tone="command" title="Presidency" sub="Joseph Aoun, President of the Republic" />
          <Box tone="command" title="Prime Minister / Council of Ministers" sub="Nawaf Salam (Prime Minister) - approves priorities, policies and coordination" />
          <Box tone="state" title="Deputy Prime Minister" sub="Tarek Mitri - supports cabinet coordination" />
          <Box tone="state" title="PMO / Grand Serail" sub="Strategic guidance for LEAP and reconstruction" />
        </div>
        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          <Box tone="state" title="National DRM Unit (PCM)" sub="National disaster-risk-management coordination" />
          <Box tone="state" title="National Emergency Operations Room (NEOR)" sub="PCM / DRM / MoSA - activated 2 March 2026; receives real-time reports from governorates and municipalities" />
        </div>
      </Band>

      <Band n={2} title="Local administration and reporting layer" accent={GREEN}>
        <div className="grid gap-2 lg:grid-cols-5">
          <Box
            tone="stateLight"
            title="Ministry of Social Affairs"
            sub="Haneen Sayed (Minister); Ola Boutros (LRP General Supervisor)"
            bullets={["Displacement management", "Shelters and social protection", "Sole government liaison to the Humanitarian Country Team"]}
          />
          <Box tone="stateLight" title="Ministry of Interior and Municipalities" sub="Ahmad al-Hajjar (Minister) - governorate coordination, municipal oversight" />
          <Box tone="stateLight" title="Governorates" sub="Lead sub-national coordination and prioritisation" />
          <Box tone="delivery" title="Municipalities and cadastres" sub="Report local needs: roads, rubble, water, electricity, shelters" />
          <Box
            tone="international"
            title="Partners supporting the response"
            sub="IOM DTM (displacement tracking), WFP, UNICEF, WHO, UNDP, OCHA and NGO partners"
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
          Shelter and displacement figures in the printed version (about 136,000
          displaced people in collective shelters; 682 open shelters) come from a
          Ministry of Social Affairs presentation dated 16 April 2026. They are
          reported figures, not verified here, and the printed
          versions disagree with each other on the shelter count.
        </p>
      </Band>

      <Band n={3} title="LEAP / CDR reconstruction structure (US$1 billion framework)" accent={GREEN}>
        <div className="grid gap-2 lg:grid-cols-6">
          <Box tone="international" title="LEAP (World Bank)" sub="US$1 billion scalable framework; US$250M initial financing; US$750M financing gap; Loan 9841-LB" />
          <Box tone="state" title="CDR" sub="Council for Development and Reconstruction - implementing agency" />
          <Box tone="state" title="CDR PMU" sub="Procurement, safeguards, finance, reporting and grievance redress" />
          <Box tone="stateLight" title="Ministry of Finance" sub="Yassine Jaber (Minister) - financial oversight and budget coordination" />
          <Box tone="stateLight" title="Line ministries" sub="MPWT, MoEW, MoE, MoSA, MoIM, MoPH, MoA - technical oversight" />
          <Box tone="stateLight" title="Public operators" sub="EDL, water establishments, LRA - operational execution" />
        </div>
      </Band>

      <Band n={4} title="CDR procurement and technical packages (2026)" accent={GREEN}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Box
            tone="gate"
            title="#1095 - Rubble management at a quarry site"
            sub="LEAP-CS-TA-02. Engineering and consulting services. Published 12 May 2026, deadline 7 July 2026. No award displayed at the 17 July 2026 portal check."
          />
          <Box
            tone="gate"
            title="#1082 - Supervision of road clearing and restoration"
            sub="LEAP-CS-SUP-01, covering Marjeyoun, Sour and Bent Jbeil. Published 27 February 2026, deadline 29 April 2026. Under evaluation at the 17 July 2026 portal check."
          />
          <Box
            tone="gate"
            title="#1096 - Third-Party Monitoring Agent (TPMA)"
            sub="LEAP-CS-TPMA-01. Monitoring of works, safeguards and results. Published 13 May 2026, deadline 16 July 2026; under procurement, not operating."
          />
          <Box tone="stateLight" title="LEAP-CS-TA-00 - Technical assistance to the PMU" sub="Capacity building and institutional strengthening" />
          <Box tone="stateLight" title="Grievance Redress Mechanism (GRM)" sub="Published with contact points and investigation timelines; largely not yet operational" />
          <Box tone="alert" title="Works contracts awarded by the cut-off: zero" sub="Procurement under way is a process milestone. No works contract, no verified completed output and no verified compensation payment by 31 July 2026." />
        </div>
      </Band>

      <Band n={5} title="Line ministries and public operators - implementation" accent={GREEN}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Box tone="stateLight" title="MPWT - Fayez Rasamny" sub="Roads, bridges, public works, access restoration" />
          <Box tone="stateLight" title="MoEW - Joe Saddi" sub="Electricity, water and irrigation policy" />
          <Box tone="stateLight" title="EDL" sub="Generation, transmission and distribution" />
          <Box tone="stateLight" title="Water establishments" sub="SLWE, BWE, BMLWE, NLWE - water supply and wastewater" />
          <Box tone="stateLight" title="Litani River Authority" sub="Irrigation and water infrastructure" />
          <Box tone="stateLight" title="MoE - Tamara El-Zein" sub="Environment, rubble and pollution safeguards" />
          <Box tone="stateLight" title="MoPH - Rakan Nassereddine" sub="Health facilities, primary health-care centres" />
          <Box tone="stateLight" title="MoA - Nizar Hani" sub="Agriculture, livestock, rural recovery" />
          <Box tone="stateLight" title="Ministry of Culture / DGA - Ghassan Salamé" sub="Heritage and cultural assets" />
          <Box tone="stateLight" title="LAF (engineering)" sub="Clearance and engineering support" />
          <Box tone="stateLight" title="Civil Defense and Lebanese Red Cross" sub="Search and rescue, medical response, relief" />
          <Box tone="stateLight" title="ISF - Maj. Gen. Raed Abdallah" sub="Security, traffic and public order" />
        </div>
      </Band>

      <Band n={6} title="Monitoring and accountability" accent={GREEN}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Box
            tone="stateLight"
            title="UNDP + CNRS-L damage assessments (2026)"
            sub="Beirut & Mount Lebanon: US$365.0M; 146 buildings destroyed, 264 partially damaged; 648,942 m³ of debris. South of the Litani: US$1.384B; 11,095 buildings completely destroyed; 3.1 million m³ of debris."
          />
          <Box tone="stateLight" title="CNRS-L remote sensing" sub="Geospatial monitoring, change detection against an October 2025 baseline" />
          <Box tone="gate" title="TPMA - independent verification" sub="Specified for works and safeguards; under procurement, not operating" />
          <Box tone="stateLight" title="CDR M&E unit" sub="Results framework and progress reporting" />
          <Box tone="international" title="World Bank supervision" sub="Safeguards, fiduciary rules, technical oversight, Lender's Engineer (under procurement)" />
          <Box tone="community" title="Community feedback" sub="Engagement and complaints handling through the GRM" />
        </div>
      </Band>

      <Band n={7} title="Local implementation chain" accent={GREEN}>
        <Chain
          steps={[
            { title: "Municipality / cadastre", sub: "Report needs: rubble, roads, water, electricity, shelters" },
            { title: "Union of municipalities / qaimmaqam", sub: "Consolidate and prioritise local needs" },
            { title: "Governorate / DRM", sub: "Validate, rank and prioritise" },
            { title: "PMO / Council of Ministers / LEAP", sub: "Approve priorities and allocate funding" },
            { title: "CDR PMU", sub: "Launch tenders, manage contracts and consultants" },
            { title: "Contractors / operators", sub: "Implement works on the ground" },
            { title: "TPMA / CDR M&E / World Bank", sub: "Monitor, verify and report results" },
            { title: "Communities and beneficiaries", sub: "Provide feedback and grievances" },
          ]}
        />
      </Band>

      <div className="mt-4 grid gap-2 lg:grid-cols-4">
        <Box tone="international" title="Funding and status" sub="US$250M initial World Bank financing (25% of the framework); US$750M financing gap (75%); US$4.13M disbursed (1.65% of the loan) at 29 June 2026" />
        <Box tone="gate" title="Security and access gate" sub="Lebanese Army ERW/UXO clearance is a mandatory prerequisite for all works; unexploded ordnance remains a critical risk" />
        <Box tone="stateLight" title="Procurement and transparency" sub="CDR procurement portal, World Bank procurement rules, TPMA and supervision firms, independent checks and audits, GRM, community consultation" />
        <Box tone="stateLight" title="Service restoration chains" sub="Roads and bridges, debris management, electricity, drinking water and wastewater, telecommunications, health facilities, schools and public buildings, heritage sites" />
      </div>

      <p className="mt-3 rounded-md border-2 border-[color:var(--color-rust)] bg-[#FBF3F0] px-4 py-2.5 text-center text-[12.5px] font-bold leading-relaxed text-[color:var(--color-rust)]">
        Gap in 2026: LEAP&apos;s scope is limited to 2023-24 damage. No financed
        compensation or reconstruction instrument for 2026-war damage had been
        identified by 31 July 2026.
      </p>

      <Corrections
        items={[
          "Ministry of Finance: the printed version in one variant names Youssef Khalil, who held the post in 2024. The 2026 minister is Yassine Jaber.",
          "Internal Security Forces: one printed variant names Maj. Gen. Imad Osman, the 2024 director-general. The 2026 director-general is Maj. Gen. Raed Abdallah.",
          "Beirut & Mount Lebanon assessment: buildings destroyed corrected from 160 to 146, and the debris quantity from square metres to 648,942 cubic metres, per the June 2026 assessment.",
          "Procurement numbers: the printed variants disagree (#1082 versus #1034, #1092). The numbers, subjects, publication dates and portal statuses shown here follow the procurement data: #1082 supervision, #1095 rubble management, #1096 TPMA.",
          "Package #1082 appeared twice in one printed version with two different subjects; it is shown once here, as supervision of road clearing and restoration.",
          "Water establishment acronyms corrected to SLWE, BWE, BMLWE and NLWE.",
          "The Ministry of Social Affairs minister's name is spelled Haneen Sayed here; the printed versions use three different spellings.",
          "A duplicated Ministry of Public Health box in one printed version was removed.",
          "Added the finding the printed versions omit: no works contract had been awarded, and the TPMA, Lender's Engineer and grievance mechanism were specified but not operating at the cut-off.",
        ]}
      />
    </figure>
  );
}

export default function InstitutionalStructures() {
  return (
    <div className="space-y-8">
      <Map2024 />
      <Map2026 />
    </div>
  );
}
