CREATE TYPE "public"."JobExecutionStatus" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "EndpointResult" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"endpointId" text NOT NULL,
	"success" integer NOT NULL,
	"statusCode" integer,
	"responseContent" text,
	"error" text,
	"executionTimeMs" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"requestSizeBytes" integer,
	"responseSizeBytes" integer,
	"truncated" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "JobError" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"errorMessage" text NOT NULL,
	"errorCode" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "JobExecution" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"executionPlan" text,
	"planConfidence" integer,
	"planReasoning" text,
	"executionStrategy" text,
	"status" "JobExecutionStatus" DEFAULT 'PENDING' NOT NULL,
	"executionSummary" text,
	"startTime" timestamp,
	"endTime" timestamp,
	"durationMs" integer,
	"successCount" integer DEFAULT 0,
	"failureCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "Job" ADD COLUMN "lockExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "EndpointResult" ADD CONSTRAINT "EndpointResult_jobId_Job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EndpointResult" ADD CONSTRAINT "EndpointResult_endpointId_Endpoint_id_fk" FOREIGN KEY ("endpointId") REFERENCES "public"."Endpoint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "JobError" ADD CONSTRAINT "JobError_jobId_Job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_jobId_Job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE cascade ON UPDATE no action;