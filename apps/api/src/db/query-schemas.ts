import { z } from "@hono/zod-openapi";

import { createFilteringParamsSchema, createSortingParamsSchema, paginationParamsSchema } from "@/api/lib/query-params";

// Zod schema for GET /jobs query params (pagination, sorting, filtering)
export const listJobsQuerySchema = z.object({})
    .merge(paginationParamsSchema)
    .merge(createSortingParamsSchema(["createdAt", "updatedAt", "nextRunAt"] as const))
    .merge(createFilteringParamsSchema(["status", "userId"] as const));

// TS type for validated GET /jobs query parameters
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
