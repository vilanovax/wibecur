import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import ItemsPageClient from './ItemsPageClient';
import Pagination from '@/components/admin/shared/Pagination';

export const metadata: Metadata = {
  title: 'مدیریت آیتم‌ها - پنل ادمین',
  description: 'مدیریت آیتم‌های لیست‌ها',
};

const ITEMS_PER_PAGE = 24;

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const { page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Always fetch all items - filtering will be done client-side
  // This allows the dropdown to show all lists even when one is selected

  // Get total count for pagination (all items)
  const totalCount = await dbQuery(() =>
    prisma.items.count()
  );

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const [items, lists, itemCountsByList] = await Promise.all([
    dbQuery(() =>
      prisma.items.findMany({
        skip,
        take: ITEMS_PER_PAGE,
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
      })
    ),
    dbQuery(() =>
      prisma.lists.findMany({
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
      })
    ),
    // Get item counts for each list to display in dropdown
    dbQuery(() =>
      prisma.items.groupBy({
        by: ['listId'],
        _count: {
          id: true,
        },
      })
    ),
  ]);

  // Create a map of listId -> item count
  const itemCountMap = new Map(
    itemCountsByList.map((item) => [item.listId, item._count.id])
  );

  return (
    <>
      <ItemsPageClient 
        items={items} 
        lists={lists} 
        initialListId={undefined}
        itemCountsByList={Object.fromEntries(itemCountMap)}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/items"
      />
    </>
  );
}
