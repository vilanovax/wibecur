-- AlterTable
ALTER TABLE "users" ADD COLUMN "adminPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
