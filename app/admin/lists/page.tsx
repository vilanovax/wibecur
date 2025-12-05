import { requireAdmin } from '@/lib/auth';
import { getCategories } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import ListsPageClient from './ListsPageClient';
import Pagination from '@/components/admin/shared/Pagination';

const ITEMS_PER_PAGE = 20;

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const { page = '1' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch data in parallel - optimized queries
  const [totalCount, lists, categories] = await Promise.all([
    // Count query (lightweight, no joins)
    prisma.lists.count(),
    
    // Fetch paginated lists - optimized select, no _count queries
    prisma.lists.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        categoryId: true,
        userId: true,
        badge: true,
        isPublic: true,
        isFeatured: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        viewCount: true,
        likeCount: true,
        saveCount: true,
        itemCount: true, // Use stored count instead of expensive _count query
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true, // Add role to differentiate admin and user lists
          },
        },
      },
    }),
    
    // Use cached categories (from lib/db.ts)
    getCategories(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Serialize data to ensure proper JSON conversion (handles Date objects)
  const serializedLists = JSON.parse(JSON.stringify(lists)).map((list: any) => ({
    ...list,
    itemCount: list.itemCount ?? 0,
    likeCount: list.likeCount ?? 0,
    saveCount: list.saveCount ?? 0,
  }));

  return (
    <>
      <ListsPageClient lists={serializedLists} categories={JSON.parse(JSON.stringify(categories))} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/lists"
      />
    </>
  );
}
