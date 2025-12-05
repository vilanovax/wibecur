import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import UserListsPageClient from './UserListsPageClient';
import { getCategories } from '@/lib/db';

export default async function UserListsPage() {
  // Fetch user-created public lists
  const [initialLists, categories] = await Promise.all([
    dbQuery(() =>
      prisma.lists.findMany({
        where: {
          isPublic: true,
          isActive: true,
          users: {
            role: 'USER',
          },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
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
              image: true,
            },
          },
          _count: {
            select: {
              items: true,
              list_likes: true,
              bookmarks: true,
            },
          },
        },
      })
    ),
    getCategories(),
  ]);

  // Serialize dates
  const serializedLists = initialLists.map((list) => ({
    ...list,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <UserListsPageClient initialLists={serializedLists} categories={categories} />
      <BottomNav />
    </div>
  );
}

