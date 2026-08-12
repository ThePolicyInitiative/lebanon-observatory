import { z } from "zod";

/** Query-parameter contract for GET /api/news - shared by the route
 * handler and the automated tests. */
export const newsQuerySchema = z.object({
  q: z.string().max(120).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  language: z.enum(["ar", "en", "fr", "other"]).optional(),
  sourceType: z.enum(["official", "multilateral", "un", "ngo", "media"]).optional(),
  actorLayer: z.string().max(60).optional(),
  stage: z.string().max(60).optional(),
  sector: z.string().max(60).optional(),
  location: z.string().max(60).optional(),
  onlyRelevant: z.string().optional(),
  page: z.coerce.number().int().min(1).max(50).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
