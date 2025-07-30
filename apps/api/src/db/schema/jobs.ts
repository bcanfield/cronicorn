/* eslint-disable ts/no-redeclare */
import { sql } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { users } from "./auth";

export const jobStatusEnum = pgEnum("JobStatus", [
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
]);

export const jobs = pgTable("Job", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  definitionNL: text("definitionNL").notNull(),
  nextRunAt: timestamp("nextRunAt", { mode: "string" }),
  status: jobStatusEnum("status").default("PAUSED").notNull(),
  locked: boolean("locked").default(false).notNull(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  inputTokens: integer("inputTokens").default(0).notNull(),
  outputTokens: integer("outputTokens").default(0).notNull(),
  totalTokens: integer("totalTokens").default(0).notNull(),
  reasoningTokens: integer("reasoningTokens").default(0).notNull(),
  cachedInputTokens: integer("cachedInputTokens").default(0).notNull(),
  createdAt: timestamp("createdAt", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
});

// add Zod schemas for jobs
export const selectJobsSchema = createSelectSchema(jobs);
export type selectJobsSchema = z.infer<typeof selectJobsSchema>;

export const insertJobsSchema = createInsertSchema(
  jobs,
  {
    definitionNL: schema => schema.min(5).max(1000),
  },
)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required({ definitionNL: true });
export type insertJobsSchema = z.infer<typeof insertJobsSchema>;

export const patchJobsSchema = insertJobsSchema.partial();
export type patchJobsSchema = z.infer<typeof patchJobsSchema>;

export const JOB_SORT_KEYS = ["definitionNL", "createdAt", "updatedAt", "nextRunAt"] as const;

// LIST JOBS QUERY SCHEMA
export const listJobsSchema = z.object({
  // Default to show latest items first
  sortBy: z.enum(JOB_SORT_KEYS).default("createdAt").describe("Field to sort by"),
  sortDirection: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
  page: z.coerce.number().default(1).describe("Page number for pagination"),
  pageSize: z.coerce.number().default(20).describe("Number of items per page"),
  searchQuery: z.string().optional().describe("Search query for job definitions"),
});

export type listJobsSchema = z.infer<typeof listJobsSchema>;
