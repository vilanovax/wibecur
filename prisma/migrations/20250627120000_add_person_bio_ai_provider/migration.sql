-- AlterTable
ALTER TABLE "comment_settings" ADD COLUMN IF NOT EXISTS "personBioAiProvider" TEXT NOT NULL DEFAULT 'openai';
