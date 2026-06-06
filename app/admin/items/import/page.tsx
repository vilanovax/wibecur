import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import BulkImportClient from './BulkImportClient';

export const metadata: Metadata = {
  title: 'import گروهی آیتم | پنل ادمین',
  description: 'وارد کردن دسته‌ای آیتم از JSON',
};

export default async function BulkImportPage({
  searchParams,
}: {
  searchParams: Promise<{ listId?: string; categoryId?: string }>;
}) {
  await requireAdmin();
  const { listId, categoryId } = await searchParams;

  const [categories, lists] = await Promise.all([
    prisma.categories.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, icon: true, isActive: true },
    }),
    prisma.lists.findMany({
      where: { deletedAt: null },
      include: { categories: { select: { id: true, name: true, slug: true, icon: true } } },
      orderBy: { title: 'asc' },
    }),
  ]);

  return (
    <BulkImportClient
      categories={categories}
      lists={lists.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        categoryId: l.categoryId,
        itemCount: l.itemCount,
        categories: l.categories,
      }))}
      initialListId={listId}
      initialCategoryId={categoryId}
    />
  );
}
