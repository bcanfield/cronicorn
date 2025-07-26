/* eslint-disable ts/no-redeclare */

import { z } from "@hono/zod-openapi";

// Use relative import to align with TS resolution without path aliases
import { createAdvancedFilteringParamsSchema, createSortingParamsSchema, paginationParamsSchema } from "../lib/query-params";

// Allowed sorting & filtering fields for jobs
export const JOBS_SORT_KEYS = ["definitionNL", "createdAt", "updatedAt", "nextRunAt"] as const;
export type JobsSortKey = typeof JOBS_SORT_KEYS[number];
export const JOBS_FILTER_KEYS = ["status", "userId", "definitionNL", "createdAt"] as const;
export type JobsFilterKey = typeof JOBS_FILTER_KEYS[number];

export const jobsSortSchema = createSortingParamsSchema(JOBS_SORT_KEYS);
export type jobsSortSchema = z.infer<typeof jobsSortSchema>;
export const jobsFilterSchema = createAdvancedFilteringParamsSchema(JOBS_FILTER_KEYS);
export type jobsFilterSchema = z.infer<typeof jobsFilterSchema>;

// Zod schema for GET /jobs query params (pagination, sorting, filtering)
export const listJobsQuerySchema = z.object({})
    .merge(paginationParamsSchema)
    .merge(jobsSortSchema)
    .merge(jobsFilterSchema);

// TS type for validated GET /jobs query parameters
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
