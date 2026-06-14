-- ─────────────────────────────────────────────────────────────────────────────
-- ایندکس‌های پرفورمنس (فاز ۲)
--
-- این فایل را مستقیماً با psql روی دیتابیس production اجرا کن (نه داخل تراکنش):
--   psql "$DATABASE_URL" -f prisma/migrations/manual_add_perf_indexes.sql
--
-- از CREATE INDEX CONCURRENTLY استفاده شده تا جدول‌ها در حین ساخت ایندکس قفل نشوند.
-- CONCURRENTLY نباید داخل بلوک تراکنش اجرا شود؛ هر دستور جداگانه اجرا می‌شود.
-- ─────────────────────────────────────────────────────────────────────────────

-- ۱) کوئری داغ فید دسته: WHERE categoryId + isActive + isPublic ORDER BY saveCount DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS "lists_categoryId_isActive_isPublic_saveCount_idx"
  ON "lists" ("categoryId", "isActive", "isPublic", "saveCount" DESC);

-- ۲) واکشی «جدیدترین»های هر دسته
CREATE INDEX CONCURRENTLY IF NOT EXISTS "lists_categoryId_isActive_isPublic_createdAt_idx"
  ON "lists" ("categoryId", "isActive", "isPublic", "createdAt" DESC);

-- ۳) فیلتر کریتور (users.role <> 'USER') در کوئری‌های curated
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_role_idx"
  ON "users" ("role");

-- ۴) جستجوی متنی روی عنوان آیتم‌ها (contains/insensitive) — نیازمند افزونهٔ pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "items_title_trgm_idx"
  ON "items" USING gin ("title" gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "catalog_items_title_trgm_idx"
  ON "catalog_items" USING gin ("title" gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "catalog_items_description_trgm_idx"
  ON "catalog_items" USING gin ("description" gin_trgm_ops);
