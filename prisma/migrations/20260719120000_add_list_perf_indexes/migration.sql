-- CreateIndex
CREATE INDEX "items_listId_deletedAt_order_idx" ON "items"("listId", "deletedAt", "order");

-- CreateIndex
CREATE INDEX "list_likes_listId_createdAt_idx" ON "list_likes"("listId", "createdAt");
