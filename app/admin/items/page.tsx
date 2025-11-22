import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import ItemsPageClient from './ItemsPageClient';

export const metadata: Metadata = {
  title: 'مدیریت آیتم‌ها - پنل ادمین',
  description: 'مدیریت آیتم‌های لیست‌ها',
};

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ listId?: string }>;
}) {
  await requireAdmin();

  const { listId } = await searchParams;

  // Get items based on listId filter
  const where = listId ? { listId } : {};

  const [items, lists] = await Promise.all([
    prisma.items.findMany({
      where,
      include: {
        lists: {
          include: {
            categories: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    }),
    prisma.lists.findMany({
      where: { isActive: true },
      include: {
        categories: true,
      },
      orderBy: { title: 'asc' },
    }),
  ]);

  return <ItemsPageClient items={items} lists={lists} initialListId={listId} />;
}
