import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  activeCategoryWhere,
  publicCuratedListWhere,
} from '@/lib/public-content-filters';

export type CategoryMenuChip = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  iconImage?: string | null;
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
        iconImage: true,
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
  unstable_cache(loadActiveCategoryMenu, ['active-category-menu-v2'], {
    revalidate: 600,
    tags: [CATEGORY_MENU_CACHE_TAG],
  });

export type CategoryIndexRow = {
  id: string;
  name: string;
  slug: string | null;
  icon: string | null;
  iconImage: string | null;
  color: string | null;
  order: number | null;
  /** تعداد لیست‌های عمومی کیوریت‌شده در این دسته */
  listCount: number;
};

async function loadActiveCategoryIndex(): Promise<CategoryIndexRow[]> {
  const rows = await dbQuery(() =>
    prisma.categories.findMany({
      where: activeCategoryWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        iconImage: true,
        color: true,
        order: true,
        _count: {
          select: {
            lists: { where: publicCuratedListWhere },
          },
        },
      },
      orderBy: { order: 'asc' },
    })
  );

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    iconImage: c.iconImage,
    color: c.color,
    order: c.order,
    listCount: c._count.lists,
  }));
}

/** ایندکس /categories — همان تگ منو تا با تغییر دسته باطل شود. */
export const fetchActiveCategoryIndex: () => Promise<CategoryIndexRow[]> =
  unstable_cache(loadActiveCategoryIndex, ['active-category-index-v3'], {
    revalidate: 600,
    tags: [CATEGORY_MENU_CACHE_TAG],
  });
