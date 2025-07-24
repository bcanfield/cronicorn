import { z } from "@hono/zod-openapi";

import { createFilteringParamsSchema, createSortingParamsSchema, paginationParamsSchema } from "@/api/lib/query-params";

// Allowed sorting & filtering fields for jobs
export const JOBS_SORT_KEYS = ["definitionNL", "createdAt", "updatedAt", "nextRunAt"] as const;
export type JobsSortKey = typeof JOBS_SORT_KEYS[number];
export const JOBS_FILTER_KEYS = ["status", "userId"] as const;
export type JobsFilterKey = typeof JOBS_FILTER_KEYS[number];

// Zod schema for GET /jobs query params (pagination, sorting, filtering)
export const listJobsQuerySchema = z.object({})
    .merge(paginationParamsSchema)
    .merge(createSortingParamsSchema(JOBS_SORT_KEYS))
    .merge(createFilteringParamsSchema(JOBS_FILTER_KEYS));

// TS type for validated GET /jobs query parameters
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
