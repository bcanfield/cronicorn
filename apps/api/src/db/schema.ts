/* eslint-disable ts/no-redeclare */

import type { z } from "zod";

import { sql } from "drizzle-orm";
import { boolean, integer, json, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { users } from "./auth-schema";

export * from "./auth-schema";

/*
Tasks (This is a sample table to base other tables on)
*/
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const selectTasksSchema = createSelectSchema(tasks);
export type selectTasksSchema = z.infer<typeof selectTasksSchema>;

export const insertTasksSchema = createInsertSchema(
  tasks,
  {
    name: schema => schema.min(1).max(500),
  },
).required({
  done: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type insertTasksSchema = z.infer<typeof insertTasksSchema>;

export const patchTasksSchema = insertTasksSchema.partial();
export type patchTasksSchema = z.infer<typeof patchTasksSchema>;

/*
REAL SCHEMA BELOW
*/
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
    definitionNL: schema => schema.min(1).max(1000),
  },
)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .required({ definitionNL: true });
export type insertJobsSchema = z.infer<typeof insertJobsSchema>;

export const patchJobsSchema = insertJobsSchema.partial();
export type patchJobsSchema = z.infer<typeof patchJobsSchema>;

// Re-export query-schemas so UI can import ListJobsQuery
export * from "./query-schemas";

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
