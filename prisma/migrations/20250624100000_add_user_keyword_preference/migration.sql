-- CreateTable
CREATE TABLE "user_keyword_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'inferred',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_keyword_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_keyword_preference_userId_idx" ON "user_keyword_preference"("userId");

-- CreateIndex
CREATE INDEX "user_keyword_preference_keywordId_idx" ON "user_keyword_preference"("keywordId");

-- CreateIndex
CREATE UNIQUE INDEX "user_keyword_preference_userId_keywordId_key" ON "user_keyword_preference"("userId", "keywordId");

-- AddForeignKey
ALTER TABLE "user_keyword_preference" ADD CONSTRAINT "user_keyword_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
