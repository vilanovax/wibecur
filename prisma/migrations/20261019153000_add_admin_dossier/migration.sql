-- AlterTable
ALTER TABLE "users" ADD COLUMN "adminNote" TEXT;

-- CreateTable
CREATE TABLE "admin_login_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_login_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_login_event_userId_createdAt_idx" ON "admin_login_event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_login_event_createdAt_idx" ON "admin_login_event"("createdAt");

-- AddForeignKey
ALTER TABLE "admin_login_event" ADD CONSTRAINT "admin_login_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
