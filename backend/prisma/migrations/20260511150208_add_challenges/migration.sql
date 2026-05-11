-- CreateEnum
CREATE TYPE "challenge_frequency" AS ENUM ('daily', 'weekly', 'monthly');

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "co2_saved_kg" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "feuilles" INTEGER NOT NULL,
ADD COLUMN     "frequency" "challenge_frequency" NOT NULL,
ADD COLUMN     "parcours_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now());

-- CreateTable
CREATE TABLE "user_challenges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3),
    "co2_saved_kg" DOUBLE PRECISION NOT NULL,
    "feuilles" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_challenges_user_id_completed_at_idx" ON "user_challenges"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "user_challenges_challenge_id_idx" ON "user_challenges"("challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenges_title_parcours_id_frequency_key" ON "challenges"("title", "parcours_id", "frequency");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_parcours_id_fkey" FOREIGN KEY ("parcours_id") REFERENCES "parcours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

