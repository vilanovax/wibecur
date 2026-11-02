-- AlterTable
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "coverDisplayMode" TEXT NOT NULL DEFAULT 'ui';

-- دسته‌هایی که معمولاً کاور تایپوگرافی دارند
UPDATE "categories"
SET "coverDisplayMode" = 'baked'
WHERE "slug" IN ('cafe', 'lifestyle')
  AND "coverDisplayMode" = 'ui';
