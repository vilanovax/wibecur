-- CreateTable
CREATE TABLE "profile_picks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_picks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_picks_userId_categorySlug_sortOrder_idx" ON "profile_picks"("userId", "categorySlug", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "profile_picks_userId_catalogItemId_key" ON "profile_picks"("userId", "catalogItemId");

-- AddForeignKey
ALTER TABLE "profile_picks" ADD CONSTRAINT "profile_picks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_picks" ADD CONSTRAINT "profile_picks_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
