-- ─────────────────────────────────────────────────────────────────────────────
-- ایندکس‌های پرفورمنس لیست (فاز ۱ باقی‌مانده)
-- مطابق migration: 20260719120000_add_list_perf_indexes
--
-- برای دیتابیس‌هایی که با db push آمده‌اند و _prisma_migrations ندارند.
-- خارج از تراکنش اجرا کن:
--   psql "$DATABASE_URL_CLEAN" -f prisma/migrations/manual_add_list_perf_indexes.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS "items_listId_deletedAt_order_idx"
  ON "items" ("listId", "deletedAt", "order");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "list_likes_listId_createdAt_idx"
  ON "list_likes" ("listId", "createdAt");
