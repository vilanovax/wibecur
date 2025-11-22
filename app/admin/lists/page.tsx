import { requireAdmin } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import ListsPageClient from './ListsPageClient';

export default async function ListsPage() {
  await requireAdmin();

  const [lists, categories] = await Promise.all([
    dbQuery(() =>
      prisma.lists.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          categories: true,
          users: true,
          _count: {
            select: { items: true, list_likes: true, bookmarks: true },
          },
        },
        take: 100,
      })
    ),
    dbQuery(() =>
      prisma.categories.findMany({
        orderBy: { order: 'asc' },
      })
    ),
  ]);

  return <ListsPageClient lists={lists} categories={categories} />;
}
