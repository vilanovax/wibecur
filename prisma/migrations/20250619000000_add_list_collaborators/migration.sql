-- CreateEnum
CREATE TYPE "ListCollaboratorRole" AS ENUM ('CONTRIBUTOR', 'EDITOR');

-- CreateEnum
CREATE TYPE "ListCollaborationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'REVOKED');

-- AlterTable
ALTER TABLE "lists" ADD COLUMN "collaborationEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "list_collaborators" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ListCollaboratorRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "status" "ListCollaborationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "list_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "list_collaborators_userId_status_idx" ON "list_collaborators"("userId", "status");

-- CreateIndex
CREATE INDEX "list_collaborators_listId_status_idx" ON "list_collaborators"("listId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "list_collaborators_listId_userId_key" ON "list_collaborators"("listId", "userId");

-- AddForeignKey
ALTER TABLE "list_collaborators" ADD CONSTRAINT "list_collaborators_listId_fkey" FOREIGN KEY ("listId") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_collaborators" ADD CONSTRAINT "list_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_collaborators" ADD CONSTRAINT "list_collaborators_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
