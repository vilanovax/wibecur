-- CreateTable
CREATE TABLE "user_category_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'inferred',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_category_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_category_preference_userId_idx" ON "user_category_preference"("userId");

-- CreateIndex
CREATE INDEX "user_category_preference_categorySlug_idx" ON "user_category_preference"("categorySlug");

-- CreateIndex
CREATE UNIQUE INDEX "user_category_preference_userId_categorySlug_key" ON "user_category_preference"("userId", "categorySlug");

-- AddForeignKey
ALTER TABLE "user_category_preference" ADD CONSTRAINT "user_category_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
