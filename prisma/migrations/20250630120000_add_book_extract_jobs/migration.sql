-- CreateEnum
CREATE TYPE "BookExtractJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookExtractSource" AS ENUM ('taaghche', 'fidibo');

-- CreateEnum
CREATE TYPE "BookExtractMode" AS ENUM ('titles');

-- CreateTable
CREATE TABLE "book_extract_jobs" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "BookExtractJobStatus" NOT NULL DEFAULT 'PENDING',
    "mode" "BookExtractMode" NOT NULL DEFAULT 'titles',
    "source" "BookExtractSource" NOT NULL,
    "input" JSONB NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',
    "targetListId" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "progressMeta" JSONB,
    "resultItems" JSONB,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "book_extract_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_extract_jobs_createdById_createdAt_idx" ON "book_extract_jobs"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "book_extract_jobs_status_createdAt_idx" ON "book_extract_jobs"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "book_extract_jobs" ADD CONSTRAINT "book_extract_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
