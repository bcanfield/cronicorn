CREATE TYPE "public"."JobStatus" AS ENUM('ACTIVE', 'PAUSED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"secret" text NOT NULL,
	"secretSalt" text,
	"lastUsedAt" timestamp,
	"expiresAt" timestamp,
	"revoked" boolean DEFAULT false,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"scopes" text[],
	"description" text,
	CONSTRAINT "api_key_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ContextEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "EndpointUsage" (
	"id" text PRIMARY KEY NOT NULL,
	"endpointId" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"requestSizeBytes" integer DEFAULT 0,
	"responseSizeBytes" integer DEFAULT 0,
	"executionTimeMs" integer DEFAULT 0,
	"statusCode" integer,
	"success" integer NOT NULL,
	"truncated" integer DEFAULT 0,
	"errorMessage" text
);
--> statement-breakpoint
CREATE TABLE "Endpoint" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"method" text DEFAULT 'GET' NOT NULL,
	"bearerToken" text,
	"requestSchema" text,
	"jobId" text NOT NULL,
	"timeoutMs" integer DEFAULT 2000,
	"fireAndForget" boolean DEFAULT false NOT NULL,
	"maxRequestSizeBytes" integer DEFAULT 1048576,
	"maxResponseSizeBytes" integer DEFAULT 5242880,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Job" (
	"id" text PRIMARY KEY NOT NULL,
	"definitionNL" text NOT NULL,
	"nextRunAt" timestamp,
	"status" "JobStatus" DEFAULT 'PAUSED' NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"userId" text,
	"inputTokens" integer DEFAULT 0 NOT NULL,
	"outputTokens" integer DEFAULT 0 NOT NULL,
	"totalTokens" integer DEFAULT 0 NOT NULL,
	"reasoningTokens" integer DEFAULT 0 NOT NULL,
	"cachedInputTokens" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"content" json NOT NULL,
	"jobId" text NOT NULL,
	"source" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ContextEntry" ADD CONSTRAINT "ContextEntry_jobId_Job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "EndpointUsage" ADD CONSTRAINT "EndpointUsage_endpointId_Endpoint_id_fk" FOREIGN KEY ("endpointId") REFERENCES "public"."Endpoint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Endpoint" ADD CONSTRAINT "Endpoint_jobId_Job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_jobId_Job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE cascade ON UPDATE no action;