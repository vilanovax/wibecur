import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { activeCategoryWhere } from '@/lib/public-content-filters';

export type CategoryMenuChip = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
};

export const CATEGORY_MENU_CACHE_TAG = 'category-menu';

async function loadActiveCategoryMenu(): Promise<CategoryMenuChip[]> {
  return dbQuery(() =>
    prisma.categories.findMany({
      where: activeCategoryWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
      orderBy: { order: 'asc' },
    })
  );
}

/**
 * منوی دسته‌ها تقریباً ثابت است و برای همهٔ صفحات یکسان — کش بین‌درخواستی طولانی.
 * با revalidateTag('category-menu') هنگام تغییر دسته‌ها تازه می‌شود.
 */
export const fetchActiveCategoryMenu: () => Promise<CategoryMenuChip[]> =
  unstable_cache(loadActiveCategoryMenu, ['active-category-menu'], {
    revalidate: 600,
    tags: [CATEGORY_MENU_CACHE_TAG],
  });
