import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import ItemsPageClient from './ItemsPageClient';

export const metadata: Metadata = {
  title: 'مدیریت آیتم‌ها - پنل ادمین',
  description: 'مدیریت آیتم‌های لیست‌ها',
};

export default async function ItemsPage() {
  await requireAdmin();

  // Use a single transaction to reduce connection pool usage
  // Always fetch all items - filtering will be done client-side
  // This allows the dropdown to show all lists even when one is selected

  const { items, lists, itemCountsByList } = await dbQuery(() =>
    prisma.$transaction(
      async (tx) => {
        const [itemsResult, listsResult, itemCountsResult] = await Promise.all([
          tx.items.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              externalUrl: true,
              listId: true,
              order: true,
              metadata: true,
              voteCount: true,
              rating: true,
              createdAt: true,
              updatedAt: true,
              lists: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  categories: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      icon: true,
                      color: true,
                    },
                  },
                },
              },
            },
          }),
          tx.lists.findMany({
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              slug: true,
              categoryId: true,
              categories: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  icon: true,
                  color: true,
                },
              },
            },
            orderBy: { title: 'asc' },
          }),
          tx.items.groupBy({
            by: ['listId'],
            _count: {
              id: true,
            },
          }),
        ]);

        return {
          items: itemsResult,
          lists: listsResult,
          itemCountsByList: itemCountsResult,
        };
      },
      {
        timeout: 15000, // 15 seconds timeout
      }
    )
  );

  // Create a map of listId -> item count
  const itemCountMap = new Map(
    itemCountsByList.map((item) => [item.listId, item._count.id])
  );

  return (
    <ItemsPageClient 
      items={items} 
      lists={lists} 
      initialListId={undefined}
      itemCountsByList={Object.fromEntries(itemCountMap)}
    />
  );
}
