-- اجرای دستی: ایجاد جدول audit_log (بدون حذف داده)
-- در صورت استفاده از Prisma Migrate، این فایل را با migrate resolve ادغام کنید.

CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'audit_log_actorId_fkey'
  ) THEN
    ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "audit_log_createdAt_idx" ON "audit_log"("createdAt");
CREATE INDEX IF NOT EXISTS "audit_log_actorId_createdAt_idx" ON "audit_log"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_log_action_createdAt_idx" ON "audit_log"("action", "createdAt");
