-- Add last_monthly_quiz_at to users
ALTER TABLE "users"
ADD COLUMN "last_monthly_quiz_at" TIMESTAMPTZ;
