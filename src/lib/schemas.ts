import { z } from "zod";

/** Runtime validation for imported analytical data (run in tests and at
 * module load in development). Live news payloads are validated separately
 * in the news pipeline. */

export const roleRecordSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  year: z.union([z.literal(2024), z.literal(2026)]),
  actorName: z.string().min(1),
  actorLayer: z.enum(["official", "ngo_international", "municipal", "community"]),
  actorSubtype: z.string().nullable(),
  stage: z.string(),
  stageNo: z.number().int().min(1).max(12),
  functionColumn: z.string(),
  locationNames: z.array(z.string()),
  regions: z.array(z.string()),
  formalMandate: z.string().nullable(),
  tracedAction: z.string().nullable(),
  implementationStatus: z.enum([
    "formal_mandate",
    "announced",
    "planned",
    "financing_committed",
    "financing_disbursed",
    "procurement",
    "underway",
    "completed",
    "not_verified",
  ]),
  financingRole: z.string().nullable(),
  procurementRole: z.string().nullable(),
  implementationRole: z.string().nullable(),
  oversightRole: z.string().nullable(),
  summary: z.string(),
  comparability: z.enum(["direct", "qualified", "not_comparable", "context_only"]),
  sourceIds: z.array(z.string()),
});

export const sourceRecordSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  organisation: z.string(),
  publicationDate: z.string().nullable(),
  url: z.string().nullable(),
  sourceType: z.string(),
  accessedDate: z.string().nullable(),
});

export const stageCountsSchema = z.object({
  note: z.string(),
  stages: z.array(z.string()).length(12),
  counts: z.record(
    z.enum(["2024", "2026"]),
    z.record(
      z.enum(["official", "ngo_international", "municipal", "community"]),
      z.array(z.number().int().min(0)).length(12),
    ),
  ),
});

export const kpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  display: z.string(),
  kind: z.enum(["need", "framework", "commitment", "disbursement", "output"]),
  definition: z.string(),
  referencePeriod: z.string(),
  geographicScope: z.string(),
  sourceIds: z.array(z.string()).min(1),
});

export const newsArticleSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().nullable(),
  sourceName: z.string(),
  sourceDomain: z.string(),
  sourceType: z.enum(["official", "multilateral", "un", "ngo", "media"]),
  url: z.string().url(),
  imageUrl: z.string().nullable(),
  publishedAt: z.string(),
  language: z.enum(["ar", "en", "fr", "other"]),
  provider: z.enum(["gdelt", "reliefweb", "newsapi", "official-feed", "rss"]),
  locations: z.array(z.string()),
  sectors: z.array(z.string()),
  actorLayers: z.array(z.string()),
  valueChainStages: z.array(z.string()),
  relevanceScore: z.number(),
  duplicateGroupId: z.string().nullable(),
  relatedCount: z.number().optional(),
});
