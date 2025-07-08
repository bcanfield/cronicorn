-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "cachedInputTokens" INTEGER,
ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "outputTokens" INTEGER,
ADD COLUMN     "reasoningTokens" INTEGER,
ADD COLUMN     "totalTokens" INTEGER;
