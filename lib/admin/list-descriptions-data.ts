import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import type { ListDescriptionsPageData } from '@/lib/admin/list-description-import';

export async function loadListDescriptionsPageData(): Promise<ListDescriptionsPageData> {
  const [listsRaw, categoriesRaw] = await Promise.all([
    dbQuery(() =>
      prisma.lists.findMany({
        where: { deletedAt: null },
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          itemCount: true,
          categoryId: true,
          categories: {
            select: { id: true, name: true, slug: true, icon: true },
          },
        },
      })
    ),
    dbQuery(() =>
      prisma.categories.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, icon: true },
      })
    ),
  ]);

  return {
    lists: listsRaw.map((list) => ({
      id: list.id,
      title: list.title,
      slug: list.slug,
      description: list.description,
      itemCount: list.itemCount,
      categoryId: list.categoryId,
      categoryName: list.categories?.name ?? '—',
      categorySlug: list.categories?.slug ?? null,
      categoryIcon: list.categories?.icon ?? '📋',
    })),
    categories: categoriesRaw,
  };
}
