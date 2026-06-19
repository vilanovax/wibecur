-- AlterTable
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenanceModeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenanceTitle" TEXT DEFAULT 'در حال به‌روزرسانی';
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenanceSubtitle" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenanceMessage" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenanceShowLogo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenanceAccentColor" TEXT DEFAULT '#6366F1';
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "maintenanceAllowAdminBrowse" BOOLEAN NOT NULL DEFAULT true;
