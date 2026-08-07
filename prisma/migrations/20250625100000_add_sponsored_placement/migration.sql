-- CreateTable
CREATE TABLE "sponsored_placement" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "scopeType" TEXT NOT NULL,
    "categoryId" TEXT,
    "listIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "listId" TEXT,
    "surface" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bodyText" TEXT,
    "ctaLabel" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "sponsorName" TEXT,
    "disclosureLabel" TEXT NOT NULL DEFAULT 'تبلیغ',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsored_placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsored_placement_event" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "listId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsored_placement_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sponsored_placement_categoryId_idx" ON "sponsored_placement"("categoryId");

-- CreateIndex
CREATE INDEX "sponsored_placement_listId_idx" ON "sponsored_placement"("listId");

-- CreateIndex
CREATE INDEX "sponsored_placement_surface_isActive_startAt_idx" ON "sponsored_placement"("surface", "isActive", "startAt");

-- CreateIndex
CREATE INDEX "sponsored_placement_event_placementId_idx" ON "sponsored_placement_event"("placementId");

-- CreateIndex
CREATE INDEX "sponsored_placement_event_createdAt_idx" ON "sponsored_placement_event"("createdAt");

-- AddForeignKey
ALTER TABLE "sponsored_placement" ADD CONSTRAINT "sponsored_placement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_placement" ADD CONSTRAINT "sponsored_placement_listId_fkey" FOREIGN KEY ("listId") REFERENCES "lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_placement" ADD CONSTRAINT "sponsored_placement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_placement_event" ADD CONSTRAINT "sponsored_placement_event_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "sponsored_placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
