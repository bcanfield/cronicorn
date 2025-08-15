/* eslint-disable ts/no-redeclare */

import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { endpoints } from "./endpoints.js";
import { jobs } from "./jobs.js";

/**
 * Stores detailed results from endpoint executions including response content
 * This is separate from endpoint-usage which is focused on metrics
 */
export const endpointResults = pgTable("EndpointResult", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  endpointId: text("endpointId").notNull().references(() => endpoints.id, { onDelete: "cascade" }),
  success: integer("success").notNull(), // 1 for success, 0 for failure
  statusCode: integer("statusCode"),
  responseContent: text("responseContent"), // JSON stringified response
  error: text("error"),
  executionTimeMs: integer("executionTimeMs").notNull(),
  timestamp: timestamp("timestamp", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
  requestSizeBytes: integer("requestSizeBytes"),
  responseSizeBytes: integer("responseSizeBytes"),
  truncated: integer("truncated").default(0), // 1 if response was truncated
});

// Zod schemas for endpoint results
export const selectEndpointResultsSchema = createSelectSchema(endpointResults);
export type selectEndpointResultsSchema = z.infer<typeof selectEndpointResultsSchema>;

export const insertEndpointResultsSchema = createInsertSchema(endpointResults, {
  success: z.union([z.literal(0), z.literal(1)]),
  statusCode: z.number().optional(),
  responseContent: z.string().optional(),
  error: z.string().optional(),
  truncated: z.union([z.literal(0), z.literal(1)]).default(0),
})
  .omit({ id: true })
  .required({ jobId: true, endpointId: true, executionTimeMs: true });
export type insertEndpointResultsSchema = z.infer<typeof insertEndpointResultsSchema>;
