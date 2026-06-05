import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCachedListsIntelligenceData } from '@/lib/admin/lists-intelligence-cached';
import ListsIntelligenceClient from './ListsIntelligenceClient';

async function resolveCategoryId(categoryParam: string | undefined): Promise<string> {
  if (!categoryParam || categoryParam === 'all') return 'all';
  const cat = await dbQuery(() =>
    prisma.categories.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: categoryParam }, { slug: categoryParam }],
      },
      select: { id: true },
    })
  );
  return cat?.id ?? 'all';
}

export default async function AdminListsPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string; category?: string; page?: string }>;
}) {
  await requireAdmin();
  const { trash: trashParam, category: categoryParam, page: pageParam } = await searchParams;
  const trash = trashParam === 'true';
  const initialCategoryId = trash ? 'all' : await resolveCategoryId(categoryParam);
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const data = await getCachedListsIntelligenceData({
    trash,
    page: currentPage,
    categoryId: initialCategoryId,
  });

  return (
    <ListsIntelligenceClient
      data={data}
      trash={trash}
      initialCategoryId={initialCategoryId}
    />
  );
}
