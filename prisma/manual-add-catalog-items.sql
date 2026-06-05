-- کاتالوگ آیتم‌ها (فاز ۱ — یکپارچگی داده)
-- اجرا: psql $DATABASE_URL -f prisma/manual-add-catalog-items.sql

CREATE TABLE IF NOT EXISTS "catalog_items" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "externalUrl" TEXT,
  "categorySlug" TEXT,
  "metadata" JSONB,
  "externalKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "catalog_items_externalKey_key" ON "catalog_items"("externalKey");
CREATE INDEX IF NOT EXISTS "catalog_items_title_idx" ON "catalog_items"("title");
CREATE INDEX IF NOT EXISTS "catalog_items_categorySlug_idx" ON "catalog_items"("categorySlug");

ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "catalogItemId" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "listNote" TEXT;

DO $$ BEGIN
  ALTER TABLE "items" ADD CONSTRAINT "items_catalogItemId_fkey"
    FOREIGN KEY ("catalogItemId") REFERENCES "catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "items_listId_catalogItemId_key"
  ON "items"("listId", "catalogItemId") WHERE "catalogItemId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "items_catalogItemId_idx" ON "items"("catalogItemId");
