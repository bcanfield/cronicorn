/* eslint-disable ts/no-redeclare */

import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { pageSchema, pageSizeSchema, sortDirectionSchema } from "./common";
import { jobs } from "./jobs";

export const contextEntries = pgTable(
  "ContextEntry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("createdAt", { mode: "string" })
      .default(sql`now()`)
      .notNull(),
  },
);

// Zod schemas for context entries
export const selectContextEntriesSchema = createSelectSchema(contextEntries);
export type selectContextEntriesSchema = z.infer<typeof selectContextEntriesSchema>;

export const insertContextEntriesSchema = createInsertSchema(contextEntries, {})
  .omit({ id: true, createdAt: true })
  .required({ jobId: true, key: true, value: true });
export type insertContextEntriesSchema = z.infer<typeof insertContextEntriesSchema>;

export const patchContextEntriesSchema = insertContextEntriesSchema.partial();
export type patchContextEntriesSchema = z.infer<typeof patchContextEntriesSchema>;

// Schema for listing context entries with pagination, sorting, and optional search
export const contextEntrySortKeys = ["key", "createdAt"] as const;
export const listContextEntriesSchema = z.object({
  sortBy: z.enum(contextEntrySortKeys).default("createdAt").describe("Field to sort by"),
  sortDirection: sortDirectionSchema,
  page: pageSchema,
  pageSize: pageSizeSchema,
  searchQuery: z.string().optional().describe("Search query for keys or values"),
  jobId: z.string().optional().describe("Filter by job ID"),
});
export type listContextEntriesSchema = z.infer<typeof listContextEntriesSchema>;
