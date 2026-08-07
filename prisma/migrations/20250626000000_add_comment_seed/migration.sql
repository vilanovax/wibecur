-- CreateEnum
CREATE TYPE "AccountKind" AS ENUM ('USER', 'PERSONA', 'BOT');

-- CreateEnum
CREATE TYPE "CommentSeedTargetType" AS ENUM ('item', 'list', 'category');

-- CreateEnum
CREATE TYPE "CommentSeedCampaignStatus" AS ENUM ('draft', 'generating', 'ready', 'publishing', 'published', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "CommentSeedDraftStatus" AS ENUM ('draft', 'approved', 'rejected', 'published');

-- CreateEnum
CREATE TYPE "CommentSeedTone" AS ENUM ('positive', 'negative', 'neutral', 'question');

-- CreateEnum
CREATE TYPE "CommentSeedScopeType" AS ENUM ('category', 'list', 'item');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "accountKind" "AccountKind" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "comments" ADD COLUMN "isSeeded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "comments" ADD COLUMN "seedCampaignId" TEXT;
ALTER TABLE "comments" ADD COLUMN "seedDraftId" TEXT;

-- CreateTable
CREATE TABLE "comment_personas" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_seed_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CommentSeedCampaignStatus" NOT NULL DEFAULT 'draft',
    "targetType" "CommentSeedTargetType" NOT NULL,
    "targetIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commentCount" INTEGER NOT NULL DEFAULT 10,
    "perItemCount" INTEGER,
    "toneMix" JSONB NOT NULL,
    "wordCountMin" INTEGER NOT NULL DEFAULT 40,
    "wordCountMax" INTEGER NOT NULL DEFAULT 120,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "openaiModel" TEXT,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_seed_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_seed_drafts" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" "CommentSeedTone" NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "CommentSeedDraftStatus" NOT NULL DEFAULT 'draft',
    "publishedCommentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_seed_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_seed_rules" (
    "id" TEXT NOT NULL,
    "scopeType" "CommentSeedScopeType" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_seed_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comment_personas_username_key" ON "comment_personas"("username");
CREATE UNIQUE INDEX "comment_personas_userId_key" ON "comment_personas"("userId");
CREATE INDEX "comment_personas_isActive_idx" ON "comment_personas"("isActive");

CREATE INDEX "comment_seed_campaigns_status_idx" ON "comment_seed_campaigns"("status");
CREATE INDEX "comment_seed_campaigns_createdByAdminId_idx" ON "comment_seed_campaigns"("createdByAdminId");
CREATE INDEX "comment_seed_campaigns_createdAt_idx" ON "comment_seed_campaigns"("createdAt");

CREATE UNIQUE INDEX "comment_seed_drafts_publishedCommentId_key" ON "comment_seed_drafts"("publishedCommentId");
CREATE INDEX "comment_seed_drafts_campaignId_idx" ON "comment_seed_drafts"("campaignId");
CREATE INDEX "comment_seed_drafts_itemId_idx" ON "comment_seed_drafts"("itemId");
CREATE INDEX "comment_seed_drafts_status_idx" ON "comment_seed_drafts"("status");
CREATE INDEX "comment_seed_drafts_scheduledAt_idx" ON "comment_seed_drafts"("scheduledAt");

CREATE UNIQUE INDEX "comment_seed_rules_scopeType_scopeId_key" ON "comment_seed_rules"("scopeType", "scopeId");
CREATE INDEX "comment_seed_rules_enabled_idx" ON "comment_seed_rules"("enabled");
CREATE INDEX "comment_seed_rules_campaignId_idx" ON "comment_seed_rules"("campaignId");

CREATE UNIQUE INDEX "comments_seedDraftId_key" ON "comments"("seedDraftId");
CREATE INDEX "comments_isSeeded_idx" ON "comments"("isSeeded");
CREATE INDEX "comments_seedCampaignId_idx" ON "comments"("seedCampaignId");
CREATE INDEX "users_accountKind_idx" ON "users"("accountKind");

-- AddForeignKey
ALTER TABLE "comment_personas" ADD CONSTRAINT "comment_personas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_seed_campaigns" ADD CONSTRAINT "comment_seed_campaigns_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_seed_drafts" ADD CONSTRAINT "comment_seed_drafts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "comment_seed_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_seed_drafts" ADD CONSTRAINT "comment_seed_drafts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_seed_drafts" ADD CONSTRAINT "comment_seed_drafts_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "comment_personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comment_seed_rules" ADD CONSTRAINT "comment_seed_rules_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "comment_seed_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_seedCampaignId_fkey" FOREIGN KEY ("seedCampaignId") REFERENCES "comment_seed_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_seedDraftId_fkey" FOREIGN KEY ("seedDraftId") REFERENCES "comment_seed_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comment_seed_drafts" ADD CONSTRAINT "comment_seed_drafts_publishedCommentId_fkey" FOREIGN KEY ("publishedCommentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
