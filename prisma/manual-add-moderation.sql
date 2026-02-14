-- Vibe Moderation Engine v1 – اجرای دستی (بدون حذف داده)
-- فقط این فایل را در دیتابیس اجرا کنید؛ دیتای موجود دست نخورده می‌ماند.

-- 1) enum وضعیت مديریت آیتم
DO $$ BEGIN
  CREATE TYPE "ItemModerationStatus" AS ENUM ('NORMAL', 'SOFT_FLAG', 'UNDER_REVIEW', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) ستون وزن در گزارش‌ها (nullable برای گزارش‌های قبلی)
ALTER TABLE "item_reports"
  ADD COLUMN IF NOT EXISTS "weightSnapshot" DOUBLE PRECISION;

-- 3) جدول وضعیت مديریت آیتم
CREATE TABLE IF NOT EXISTS "item_moderation" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "flagScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "ItemModerationStatus" NOT NULL DEFAULT 'NORMAL',
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "item_moderation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "item_moderation_itemId_key" UNIQUE ("itemId"),
  CONSTRAINT "item_moderation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "item_moderation_status_idx" ON "item_moderation"("status");
CREATE INDEX IF NOT EXISTS "item_moderation_flagScore_idx" ON "item_moderation"("flagScore");
