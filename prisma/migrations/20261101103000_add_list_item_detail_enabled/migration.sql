-- AlterTable
ALTER TABLE "lists" ADD COLUMN IF NOT EXISTS "itemDetailEnabled" BOOLEAN NOT NULL DEFAULT true;
