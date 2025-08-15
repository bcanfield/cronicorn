/* eslint-disable ts/no-redeclare */

import type { z } from "zod";

import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { jobs } from "./jobs.js";

/**
 * Stores error records for job executions
 */
export const jobErrors = pgTable("JobError", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  errorMessage: text("errorMessage").notNull(),
  errorCode: text("errorCode"),
  timestamp: timestamp("timestamp", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
});

// Zod schemas for job errors
export const selectJobErrorsSchema = createSelectSchema(jobErrors);
export type selectJobErrorsSchema = z.infer<typeof selectJobErrorsSchema>;

export const insertJobErrorsSchema = createInsertSchema(jobErrors)
  .omit({ id: true, timestamp: true })
  .required({ jobId: true, errorMessage: true });
export type insertJobErrorsSchema = z.infer<typeof insertJobErrorsSchema>;
