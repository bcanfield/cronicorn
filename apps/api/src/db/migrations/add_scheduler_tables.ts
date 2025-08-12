import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { endpoints } from "../schema/endpoints";
import { jobs } from "../schema/jobs";

export const jobExecutions = pgTable("JobExecution", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    // Execution planning data
    executionPlan: text("executionPlan"), // JSON stringified plan
    planConfidence: integer("planConfidence"), // 0-100 confidence level
    planReasoning: text("planReasoning"), // AI reasoning for plan
    executionStrategy: text("executionStrategy"), // sequential, parallel, mixed
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

export const endpointResults = pgTable("EndpointResult", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
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

export const jobErrors = pgTable("JobError", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    jobId: text("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    errorMessage: text("errorMessage").notNull(),
    errorCode: text("errorCode"),
    timestamp: timestamp("timestamp", { mode: "string" })
        .default(sql`now()`)
        .notNull(),
});
