/* eslint-disable ts/no-redeclare */

import { sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { jobs } from "./jobs.js";

/**
 * Job execution status enum indicating the current state of a job execution
 * - PENDING: Execution is pending
 * - RUNNING: Execution is in progress
 * - COMPLETED: Execution completed successfully
 * - FAILED: Execution failed
 */
export const jobExecutionStatusEnum = pgEnum("JobExecutionStatus", [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);

/**
 * Stores execution details for job runs including plans, summaries, and metrics
 */
export const jobExecutions = pgTable("JobExecution", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  // Execution planning data
  executionPlan: text("executionPlan"), // JSON stringified plan
  planConfidence: integer("planConfidence"), // 0-100 confidence level
  planReasoning: text("planReasoning"), // AI reasoning for plan
  executionStrategy: text("executionStrategy"), // sequential, parallel, mixed
  // Execution status
  status: jobExecutionStatusEnum("status").default("PENDING").notNull(),
  // Execution result data
  executionSummary: text("executionSummary"), // JSON stringified summary
  startTime: timestamp("startTime", { mode: "string" }),
  endTime: timestamp("endTime", { mode: "string" }),
  durationMs: integer("durationMs"),
  successCount: integer("successCount").default(0),
  failureCount: integer("failureCount").default(0),
  // Timestamps
  createdAt: timestamp("createdAt", { mode: "string" })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "string" }),
});

// Zod schemas for job executions
export const selectJobExecutionsSchema = createSelectSchema(jobExecutions);
export type selectJobExecutionsSchema = z.infer<typeof selectJobExecutionsSchema>;

export const insertJobExecutionsSchema = createInsertSchema(jobExecutions)
  .omit({ id: true, createdAt: true })
  .required({ jobId: true });
export type insertJobExecutionsSchema = z.infer<typeof insertJobExecutionsSchema>;

export const patchJobExecutionsSchema = insertJobExecutionsSchema.partial();
export type patchJobExecutionsSchema = z.infer<typeof patchJobExecutionsSchema>;

// Helper type for structured execution plan data
export const executionPlanSchema = z.object({
  endpointsToCall: z.array(
    z.object({
      endpointId: z.string(),
      parameters: z.record(z.unknown()).optional(),
      headers: z.record(z.string()).optional(),
      priority: z.number(),
      dependsOn: z.array(z.string()).optional(),
      critical: z.boolean(),
    }),
  ),
  executionStrategy: z.enum(["sequential", "parallel", "mixed"]),
  concurrencyLimit: z.number().optional(),
  preliminaryNextRunAt: z.string().optional(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});
export type executionPlanSchema = z.infer<typeof executionPlanSchema>;
