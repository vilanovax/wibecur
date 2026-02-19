-- AlterTable: add trendingWeight to categories (default 1.0 for algorithm weight)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "trendingWeight" DOUBLE PRECISION NOT NULL DEFAULT 1;
