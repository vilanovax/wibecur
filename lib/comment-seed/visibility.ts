import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

type ItemScope = {
  itemId: string;
  listId: string | null;
  categoryId: string | null;
};

/** آیا کامنت seed برای این آیتم باید در API عمومی نمایش داده شود؟ */
export async function isSeededCommentVisibleForItem(
  itemScope: ItemScope,
  isSeeded: boolean
): Promise<boolean> {
  if (!isSeeded) return true;

  const rules = await dbQuery(() =>
    prisma.comment_seed_rules.findMany({
      where: {
        enabled: false,
        OR: [
          { scopeType: 'item', scopeId: itemScope.itemId },
          ...(itemScope.listId ? [{ scopeType: 'list' as const, scopeId: itemScope.listId }] : []),
          ...(itemScope.categoryId
            ? [{ scopeType: 'category' as const, scopeId: itemScope.categoryId }]
            : []),
        ],
      },
      select: { id: true },
      take: 1,
    })
  );

  return rules.length === 0;
}

export async function filterSeededCommentsForPublic<
  T extends { id: string; isSeeded: boolean }
>(comments: T[], itemScope: ItemScope): Promise<T[]> {
  const hasSeeded = comments.some((c) => c.isSeeded);
  if (!hasSeeded) return comments;

  const disabledRules = await dbQuery(() =>
    prisma.comment_seed_rules.findMany({
      where: { enabled: false },
      select: { scopeType: true, scopeId: true },
    })
  );

  if (disabledRules.length === 0) return comments;

  const disabledItems = new Set(
    disabledRules.filter((r) => r.scopeType === 'item').map((r) => r.scopeId)
  );
  const disabledLists = new Set(
    disabledRules.filter((r) => r.scopeType === 'list').map((r) => r.scopeId)
  );
  const disabledCategories = new Set(
    disabledRules.filter((r) => r.scopeType === 'category').map((r) => r.scopeId)
  );

  const scopeDisabled =
    disabledItems.has(itemScope.itemId) ||
    (itemScope.listId != null && disabledLists.has(itemScope.listId)) ||
    (itemScope.categoryId != null && disabledCategories.has(itemScope.categoryId));

  if (!scopeDisabled) return comments;

  return comments.filter((c) => !c.isSeeded);
}
