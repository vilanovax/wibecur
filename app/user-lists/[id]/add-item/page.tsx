import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCategories } from '@/lib/db';
import { auth } from '@/lib/auth-config';

import { notFound } from 'next/navigation';
import AddItemClient from './AddItemClient';

export default async function AddItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  let currentUserId = session?.user ? ((session.user as any).id || null) : null;

  // If we have a session but no ID, try to get user ID from email
  if (!currentUserId && session?.user?.email) {
    const userEmail = session.user.email;
    if (!userEmail) {
      return notFound();
    }
    const userFromEmail = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: userEmail },
        select: { id: true },
      })
    );
    currentUserId = userFromEmail?.id || null;
  }

  // Get the list to verify ownership
  const list = await dbQuery(() =>
    prisma.lists.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        userId: true,
        isActive: true,
        categoryId: true,
        items: {
          select: {
            id: true,
          },
        },
      },
    })
  );

  if (!list || !list.isActive) {
    notFound();
  }

  // Verify ownership
  if (list.userId !== currentUserId) {
    notFound();
  }

  // Get all items from public lists only
  const [allItems, categories, allLists] = await Promise.all([
    dbQuery(() =>
      prisma.items.findMany({
        where: {
          lists: {
            isActive: true,
            isPublic: true, // Only public lists
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          externalUrl: true,
          listId: true,
          createdAt: true,
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
        orderBy: { createdAt: 'desc' },
      })
    ),
    getCategories(),
    dbQuery(() =>
      prisma.lists.findMany({
        where: {
          isActive: true,
          isPublic: true, // Only public lists
        },
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
        orderBy: { createdAt: 'desc' },
      })
    ),
  ]);

  // Get list of item IDs already in the list (to exclude them)
  const existingItemIds = new Set(list.items.map((item) => item.id));

  // Serialize dates
  const serializedItems = allItems
    .filter((item) => !existingItemIds.has(item.id))
    .map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    }));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <AddItemClient
        listId={id}
        listTitle={list.title}
        items={serializedItems}
        categories={categories}
        lists={allLists.map((l) => ({
          ...l,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))}
      />
      <BottomNav />
    </div>
  );
}

