ALTER TABLE "Endpoint" ALTER COLUMN "requestSchema" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "api_key" ADD COLUMN "secretSalt" text;