ALTER TABLE "Endpoint" ALTER COLUMN "timeoutMs" SET DEFAULT 2000;--> statement-breakpoint
ALTER TABLE "Endpoint" ADD COLUMN "maxRequestSizeBytes" integer DEFAULT 1048576;--> statement-breakpoint
ALTER TABLE "Endpoint" ADD COLUMN "maxResponseSizeBytes" integer DEFAULT 5242880;