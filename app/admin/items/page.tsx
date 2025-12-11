import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import ItemsPageClient from './ItemsPageClient';

export const metadata: Metadata = {
  title: 'مدیریت آیتم‌ها - پنل ادمین',
  description: 'مدیریت آیتم‌های لیست‌ها',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    listId?: string;
  }>;
}

export default async function ItemsPage({ searchParams }: PageProps) {
  // Check admin access first (redirect will throw NEXT_REDIRECT which is expected)
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const perPage = parseInt(params.perPage || '24');
  const listId = params.listId;
  
  try {

    // Use a single transaction to reduce connection pool usage
    // Fetch paginated items with total count

    const skip = (page - 1) * perPage;

    const { items, lists, itemCountsByList, totalItems } = await dbQuery(() =>
      prisma.$transaction(
        async (tx) => {
          const [itemsResult, listsResult, itemCountsResult, totalCount] = await Promise.all([
            tx.items.findMany({
              skip,
              take: perPage,
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
                commentsEnabled: true,
                maxComments: true,
                lists: {
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
                createdAt: true,
                updatedAt: true,
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
            tx.items.count(),
          ]);

          return {
            items: itemsResult,
            lists: listsResult,
            itemCountsByList: itemCountsResult,
            totalItems: totalCount,
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

    // Serialize dates for client component
    const serializedItems = items.map((item) => ({
      ...item,
      createdAt: item.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: item.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    const serializedLists = lists.map((list) => ({
      ...list,
      createdAt: list.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: list.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    const totalPages = Math.ceil(totalItems / perPage);

    return (
      <ItemsPageClient
        items={serializedItems as any}
        lists={serializedLists as any}
        initialListId={listId}
        itemCountsByList={Object.fromEntries(itemCountMap)}
        currentPage={page}
        perPage={perPage}
        totalItems={totalItems}
        totalPages={totalPages}
      />
    );
  } catch (error: any) {
    // Ignore NEXT_REDIRECT - it's expected behavior
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect to let Next.js handle it
    }
    
    console.error('Error in ItemsPage:', error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">خطا در بارگذاری صفحه</h1>
        <p className="text-red-600">{error.message || 'خطای نامشخص'}</p>
      </div>
    );
  }
}
