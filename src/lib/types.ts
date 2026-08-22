export type Year = 2024 | 2026;

export type ActorLayer =
  | "official"
  | "ngo_international"
  | "municipal"
  | "community";

export type Comparability =
  | "direct"
  | "qualified"
  | "not_comparable"
  | "context_only";

export type ImplementationStatus =
  | "formal_mandate"
  | "announced"
  | "planned"
  | "financing_committed"
  | "financing_disbursed"
  | "procurement"
  | "underway"
  | "completed"
  | "not_verified";

export type RegionId =
  | "south_nabatieh"
  | "beirut_mount_lebanon"
  | "bekaa_baalbek_hermel"
  | "north"
  | "camps_migrant"
  | "national_multi"
  | "named_localities";

export type RoleRecord = {
  id: string;
  actorId: string;
  year: Year;
  actorName: string;
  actorLayer: ActorLayer;
  actorSubtype: string | null;
  stage: string;
  stageNo: number;
  functionColumn: string;
  locationNames: string[];
  regions: string[];
  formalMandate: string | null;
  tracedAction: string | null;
  implementationStatus: ImplementationStatus;
  financingRole: string | null;
  procurementRole: string | null;
  implementationRole: string | null;
  oversightRole: string | null;
  summary: string;
  comparability: Comparability;
  sourceIds: string[];
};

export type ActorEntry = {
  id: string;
  year: Year;
  name: string;
  layer: ActorLayer;
  subtype: string;
  deJureDeFacto: string | null;
  recordCount: number;
  sourceIds: string[];
};

export type SourceRecord = {
  id: string;
  title: string;
  organisation: string;
  publicationDate: string | null;
  url: string | null;
  sourceType: string;
  accessedDate: string | null;
};

export type CatalogSource = {
  id: string;
  year: Year;
  section: string;
  mention: string;
  supports: string;
  urls: string[];
};

export type FinanceStatus =
  | "need"
  | "framework"
  | "approved"
  | "committed"
  | "disbursed"
  | "not_verified";

export type FinanceMetric = {
  id: string;
  label: string;
  labelAr: string;
  amountUsd: number;
  status: FinanceStatus;
  pctOfNeed?: number;
  pctOfLoan?: number;
  note?: string;
  noteAr?: string;
  date: string | null;
  geographicScope: string;
  owner?: string;
  sourceIds: string[];
};

export type Kpi = {
  id: string;
  label: string;
  value: number;
  display: string;
  displayAr: string;
  kind: "need" | "framework" | "commitment" | "disbursement" | "output";
  definition: string;
  referencePeriod: string;
  geographicScope: string;
  sourceIds: string[];
};

export type TimelineEvent = {
  id: string;
  date: string;
  label: string;
  labelAr: string;
  detail: string;
  detailAr: string;
  track: "conflict" | "data" | "state" | "finance" | "procurement";
  status: "completed" | "procurement" | "not_verified" | "context";
  sourceIds: string[];
};

export type StageCounts = {
  stages: string[];
  counts: Record<"2024" | "2026", Record<ActorLayer, number[]>>;
};

export type NewsArticle = {
  id: string;
  title: string;
  description: string | null;
  sourceName: string;
  sourceDomain: string;
  sourceType: "official" | "multilateral" | "un" | "ngo" | "media";
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  language: "ar" | "en" | "fr" | "other";
  provider: "gdelt" | "reliefweb" | "newsapi" | "official-feed" | "rss";
  locations: string[];
  sectors: string[];
  actorLayers: string[];
  valueChainStages: string[];
  relevanceScore: number;
  duplicateGroupId: string | null;
  relatedCount?: number;
  /**
   * True when the link goes through an aggregator's redirect rather than
   * straight to the publisher. Google News now hands out opaque tokens that
   * cannot be resolved offline, so the reader is told before clicking.
   */
  viaAggregator?: boolean;
};

export type NewsResponse = {
  articles: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
  providers: {
    name: string;
    ok: boolean;
    fromCache: boolean;
    cacheAgeSeconds: number | null;
    error: string | null;
  }[];
  lastUpdated: string;
};
