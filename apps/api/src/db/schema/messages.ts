/* eslint-disable ts/no-redeclare */

import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { pageSchema, pageSizeSchema, sortDirectionSchema } from "./common";
import { jobs } from "./jobs";

export const messages = pgTable("Message", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    role: text("role").notNull(),
    content: json("content").notNull(),
    jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "string" })
        .default(sql`now()`)
        .notNull(),
    updatedAt: timestamp("updatedAt", { mode: "string" })
        .default(sql`now()`)
        .notNull(),
});

// Zod schemas for messages
export const selectMessagesSchema = createSelectSchema(messages);
export type selectMessagesSchema = z.infer<typeof selectMessagesSchema>;

export const insertMessagesSchema = createInsertSchema(messages, {})
    .omit({ id: true, createdAt: true, updatedAt: true })
    .required({ role: true, content: true, jobId: true });
export type insertMessagesSchema = z.infer<typeof insertMessagesSchema>;

export const patchMessagesSchema = insertMessagesSchema.partial();
export type patchMessagesSchema = z.infer<typeof patchMessagesSchema>;

// Schema for listing messages with pagination, sorting, and optional search
export const messageSortKeys = ["role", "createdAt", "updatedAt"] as const;
export const listMessagesSchema = z.object({
    sortBy: z.enum(messageSortKeys).default("createdAt").describe("Field to sort by"),
    sortDirection: sortDirectionSchema,
    page: pageSchema,
    pageSize: pageSizeSchema,
    searchQuery: z.string().optional().describe("Search query for message content"),
    jobId: z.string().optional().describe("Filter by job ID"),
})
export type listMessagesSchema = z.infer<typeof listMessagesSchema>;
