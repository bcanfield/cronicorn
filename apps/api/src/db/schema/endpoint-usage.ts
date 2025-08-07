/* eslint-disable ts/no-redeclare */

import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { pageSchema, pageSizeSchema, sortDirectionSchema } from "./common";
import { endpoints } from "./endpoints";

/**
 * Schema for tracking endpoint execution metrics
 * Stores data about each execution of an endpoint including request/response sizes,
 * execution time, status code, and success/failure information
 */
export const endpointUsage = pgTable("EndpointUsage", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    endpointId: text("endpointId").notNull().references(() => endpoints.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp", { mode: "string" })
        .default(sql`now()`)
        .notNull(),
    requestSizeBytes: integer("requestSizeBytes").default(0),
    responseSizeBytes: integer("responseSizeBytes").default(0),
    executionTimeMs: integer("executionTimeMs").default(0),
    statusCode: integer("statusCode"),
    success: integer("success").notNull(), // 1 for success, 0 for failure
    truncated: integer("truncated").default(0), // 1 if response was truncated, 0 otherwise
    errorMessage: text("errorMessage"),
});

// Zod schemas for endpointUsage
export const selectEndpointUsageSchema = createSelectSchema(endpointUsage);
export type selectEndpointUsageSchema = z.infer<typeof selectEndpointUsageSchema>;

export const insertEndpointUsageSchema = createInsertSchema(endpointUsage, {
    requestSizeBytes: z.number().min(0),
    responseSizeBytes: z.number().min(0),
    executionTimeMs: z.number().min(0),
    statusCode: z.number().optional(),
    success: z.union([z.literal(0), z.literal(1)]),
    truncated: z.union([z.literal(0), z.literal(1)]).default(0),
    errorMessage: z.string().optional(),
})
    .omit({ id: true, timestamp: true })
    .required({ endpointId: true, success: true });
export type insertEndpointUsageSchema = z.infer<typeof insertEndpointUsageSchema>;

// Schema for listing usage with pagination, sorting, filtering by date range
export const endpointUsageSortKeys = ["timestamp", "requestSizeBytes", "responseSizeBytes", "executionTimeMs"] as const;
export const listEndpointUsageSchema = z.object({
    sortBy: z.enum(endpointUsageSortKeys).default("timestamp").describe("Field to sort by"),
    sortDirection: sortDirectionSchema,
    page: pageSchema,
    pageSize: pageSizeSchema,
    startDate: z.string().optional().describe("Start date for filtering (ISO format)"),
    endDate: z.string().optional().describe("End date for filtering (ISO format)"),
    endpointId: z.string().uuid().optional().describe("Filter by specific endpoint"),
    success: z.union([z.literal("1"), z.literal("0")]).optional().describe("Filter by success (1) or failure (0)"),
});
export type listEndpointUsageSchema = z.infer<typeof listEndpointUsageSchema>;

// Schema for usage statistics/aggregation
export const usageStatsSchema = z.object({
    totalExecutions: z.number(),
    successCount: z.number(),
    failureCount: z.number(),
    avgRequestSizeBytes: z.number(),
    avgResponseSizeBytes: z.number(),
    avgExecutionTimeMs: z.number(),
    totalRequestSizeBytes: z.number(),
    totalResponseSizeBytes: z.number(),
    totalExecutionTimeMs: z.number(),
});
export type usageStatsSchema = z.infer<typeof usageStatsSchema>;

// Schema for filtering usage statistics
export const usageStatsFilterSchema = z.object({
    startDate: z.string().optional().describe("Start date for filtering (ISO format)"),
    endDate: z.string().optional().describe("End date for filtering (ISO format)"),
    endpointId: z.string().uuid().optional().describe("Filter by specific endpoint"),
});
export type usageStatsFilterSchema = z.infer<typeof usageStatsFilterSchema>;

// Schema for usage by day/week/month
export const timeSeriesSchema = z.object({
    period: z.string(), // ISO date or YYYY-MM or YYYY-WW
    count: z.number(),
    successCount: z.number(),
    failureCount: z.number(),
    avgRequestSizeBytes: z.number(),
    avgResponseSizeBytes: z.number(),
    avgExecutionTimeMs: z.number(),
});
export type timeSeriesSchema = z.infer<typeof timeSeriesSchema>;

// Schema for time series aggregation options
export const timeSeriesOptionsSchema = z.object({
    interval: z.enum(["day", "week", "month"]).default("day"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    endpointId: z.string().uuid().optional(),
});
export type timeSeriesOptionsSchema = z.infer<typeof timeSeriesOptionsSchema>;
