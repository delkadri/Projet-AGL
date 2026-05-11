-- AlterTable
ALTER TABLE "users" ADD COLUMN "last_monthly_quiz_at" TIMESTAMPTZ(6);
ALTER TABLE "users" ADD COLUMN "next_monthly_quiz_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "monthly_quizzes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quiz_data" JSONB NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'scheduled',

    CONSTRAINT "monthly_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_quiz_answers" (
    "id" TEXT NOT NULL,
    "monthly_quiz_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer" JSONB NOT NULL,

    CONSTRAINT "monthly_quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_quizzes_user_id_idx" ON "monthly_quizzes"("user_id");

-- CreateIndex
CREATE INDEX "monthly_quizzes_scheduled_at_idx" ON "monthly_quizzes"("scheduled_at");

-- CreateIndex
CREATE INDEX "monthly_quizzes_user_id_scheduled_at_idx" ON "monthly_quizzes"("user_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "monthly_quiz_answers_monthly_quiz_id_idx" ON "monthly_quiz_answers"("monthly_quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_quiz_answers_monthly_quiz_id_question_id_key" ON "monthly_quiz_answers"("monthly_quiz_id", "question_id");

-- AddForeignKey
ALTER TABLE "monthly_quizzes" ADD CONSTRAINT "monthly_quizzes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_quiz_answers" ADD CONSTRAINT "monthly_quiz_answers_monthly_quiz_id_fkey" FOREIGN KEY ("monthly_quiz_id") REFERENCES "monthly_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
