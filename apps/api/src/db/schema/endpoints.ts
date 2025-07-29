/* eslint-disable ts/no-redeclare */

import { sql } from "drizzle-orm";
import { boolean, integer, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { pageSchema, pageSizeSchema, sortDirectionSchema } from "./common";
import { jobs } from "./jobs";

export const endpoints = pgTable("Endpoint", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    url: text("url").notNull(),
    method: text("method").default("GET").notNull(),
    bearerToken: text("bearerToken"),
    requestSchema: json("requestSchema"),
    jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    timeoutMs: integer("timeoutMs").default(5000),
    fireAndForget: boolean("fireAndForget").default(false).notNull(),
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

export const insertEndpointsSchema = createInsertSchema(endpoints, {})
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
