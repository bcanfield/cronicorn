/*
  Warnings:

  - Made the column `cachedInputTokens` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `inputTokens` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `outputTokens` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reasoningTokens` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalTokens` on table `Job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
-- Set existing NULL values to 0 for the columns
UPDATE "Job" SET "cachedInputTokens" = 0 WHERE "cachedInputTokens" IS NULL;
UPDATE "Job" SET "inputTokens" = 0 WHERE "inputTokens" IS NULL;
UPDATE "Job" SET "outputTokens" = 0 WHERE "outputTokens" IS NULL;
UPDATE "Job" SET "reasoningTokens" = 0 WHERE "reasoningTokens" IS NULL;
UPDATE "Job" SET "totalTokens" = 0 WHERE "totalTokens" IS NULL;

-- Alter the table to set NOT NULL and default values
ALTER TABLE "Job" ALTER COLUMN "cachedInputTokens" SET NOT NULL,
ALTER COLUMN "cachedInputTokens" SET DEFAULT 0,
ALTER COLUMN "inputTokens" SET NOT NULL,
ALTER COLUMN "inputTokens" SET DEFAULT 0,
ALTER COLUMN "outputTokens" SET NOT NULL,
ALTER COLUMN "outputTokens" SET DEFAULT 0,
ALTER COLUMN "reasoningTokens" SET NOT NULL,
ALTER COLUMN "reasoningTokens" SET DEFAULT 0,
ALTER COLUMN "totalTokens" SET NOT NULL,
ALTER COLUMN "totalTokens" SET DEFAULT 0;
