-- CreateTable
CREATE TABLE "person_profiles" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "imageUrl" TEXT,
    "tmdbId" INTEGER,
    "externalUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_profiles_role_slug_key" ON "person_profiles"("role", "slug");

-- CreateIndex
CREATE INDEX "person_profiles_role_slug_idx" ON "person_profiles"("role", "slug");
