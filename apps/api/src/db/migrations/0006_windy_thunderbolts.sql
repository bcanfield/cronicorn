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
ALTER TABLE "EndpointUsage" ADD CONSTRAINT "EndpointUsage_endpointId_Endpoint_id_fk" FOREIGN KEY ("endpointId") REFERENCES "public"."Endpoint"("id") ON DELETE cascade ON UPDATE no action;