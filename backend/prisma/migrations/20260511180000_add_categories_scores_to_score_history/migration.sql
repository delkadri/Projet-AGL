-- AlterTable
ALTER TABLE "score_history" ADD COLUMN IF NOT EXISTS "categories_scores" JSONB;
