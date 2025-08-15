/* eslint-disable ts/no-redeclare */

import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { pageSchema, pageSizeSchema, sortDirectionSchema } from "./common.js";
import { jobs } from "./jobs.js";

export const endpoints = pgTable("Endpoint", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").default("GET").notNull(),
  bearerToken: text("bearerToken"),
  requestSchema: text("requestSchema"),
  jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  timeoutMs: integer("timeoutMs").default(2000),
  fireAndForget: boolean("fireAndForget").default(false).notNull(),
  // Size limits for request and response in bytes
  maxRequestSizeBytes: integer("maxRequestSizeBytes").default(1048576), // Default: 1MB
  maxResponseSizeBytes: integer("maxResponseSizeBytes").default(5242880), // Default: 5MB
  createdAt: timestamp("createdAt", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
});
// Zod schemas for endpoints
export const selectEndpointsSchema = createSelectSchema(endpoints);
export type selectEndpointsSchema = z.infer<typeof selectEndpointsSchema>;

export const insertEndpointsSchema = createInsertSchema(endpoints, {
  url: z.string().url().describe("The URL of the endpoint"),
  timeoutMs: z.number().min(1000).max(30000).default(5000).describe("Timeout in milliseconds").optional(),
  maxRequestSizeBytes: z.number().min(1024).max(10485760).default(1048576).describe("Maximum allowed request body size in bytes (1KB to 10MB, default 1MB)").optional(),
  maxResponseSizeBytes: z.number().min(1024).max(52428800).default(5242880).describe("Maximum allowed response body size in bytes (1KB to 50MB, default 5MB)").optional(),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required({ name: true, url: true, jobId: true });
export type insertEndpointsSchema = z.infer<typeof insertEndpointsSchema>;

export const patchEndpointsSchema = insertEndpointsSchema.partial();
export type patchEndpointsSchema = z.infer<typeof patchEndpointsSchema>;

// Schema for listing endpoints with pagination, sorting, and optional search
export const endpointSortKeys = ["name", "createdAt", "updatedAt"] as const;
export const listEndpointsSchema = z.object({
  sortBy: z.enum(endpointSortKeys).default("createdAt").describe("Field to sort by"),
  sortDirection: sortDirectionSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
  searchQuery: z.string().optional().describe("Search query for endpoint names"),
});
export type listEndpointsSchema = z.infer<typeof listEndpointsSchema>;
