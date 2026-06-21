import type { Prisma } from '@prisma/client';

/**
 * لیست‌هایی که در دستهٔ غیرفعال (یا حذف‌شده) هستند در UI عمومی نمایش داده نمی‌شوند.
 */
export const publicListCategoryFilter: Prisma.listsWhereInput = {
  OR: [
    { categoryId: null },
    { categories: { isActive: true, deletedAt: null } },
  ],
};

/** لیست عمومی فعال */
export const publicListWhere: Prisma.listsWhereInput = {
  isActive: true,
  isPublic: true,
  deletedAt: null,
  ...publicListCategoryFilter,
};

/** لیست‌های کیوریتد ادمین (هوم، اکسپلور، ترند) */
export const publicCuratedListWhere: Prisma.listsWhereInput = {
  ...publicListWhere,
  users: { role: { not: 'USER' } },
};

export const activeCategoryWhere: Prisma.categoriesWhereInput = {
  isActive: true,
  deletedAt: null,
};

/** آیتم‌های فعال (غیرحذف‌شده) در UI عمومی */
export const publicActiveItemWhere: Prisma.itemsWhereInput = {
  deletedAt: null,
};

/** آیتم عمومی قابل نمایش — حذف‌شده و مخفی/در بررسی نیست */
export const publicItemWhere: Prisma.itemsWhereInput = {
  deletedAt: null,
  OR: [{ item_moderation: null }, { item_moderation: { status: { notIn: ['HIDDEN', 'UNDER_REVIEW'] } } }],
};

type ListWithCategory = {
  categoryId?: string | null;
  categories?: { isActive?: boolean } | null;
};

/** فیلتر دفاعی روی آرایه‌های از قبل لودشده */
export function filterListsInActiveCategories<T extends ListWithCategory>(lists: T[]): T[] {
  return lists.filter((l) => {
    if (!l.categoryId) return true;
    return l.categories?.isActive === true;
  });
}

export function isListVisibleInPublicFeed(list: ListWithCategory): boolean {
  if (!list.categoryId) return true;
  return list.categories?.isActive === true;
}
