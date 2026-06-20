import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCategories } from '@/lib/db';
import { auth } from '@/lib/auth-config';
import { getListAccessForUser } from '@/lib/list-collaboration';
import { fetchBrowseTotals } from '@/lib/browse-public-items';
import { notFound } from 'next/navigation';
import AddItemClient from './AddItemClient';

export default async function AddItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  let currentUserId = session?.user ? (session.user.id || null) : null;

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

  const list = await dbQuery(() =>
    prisma.lists.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        userId: true,
        isActive: true,
        items: {
          select: {
            id: true,
            catalogItemId: true,
            title: true,
          },
        },
      },
    })
  );

  if (!list || !list.isActive) {
    notFound();
  }

  const access = currentUserId
    ? await dbQuery(() => getListAccessForUser(list, currentUserId))
    : null;
  if (!access?.canAddItems) {
    notFound();
  }

  const existingInList = list.items.map((item) => ({
    personalItemId: item.id,
    catalogItemId: item.catalogItemId,
    titleKey: item.title.trim().toLowerCase(),
  }));

  const existingKeys = {
    catalogItemIds: existingInList
      .map((e) => e.catalogItemId)
      .filter((cid): cid is string => Boolean(cid)),
    titleKeys: existingInList.map((e) => e.titleKey).filter(Boolean),
  };

  const [categories, publicLists, totals] = await Promise.all([
    getCategories(),
    dbQuery(() =>
      prisma.lists.findMany({
        where: { isActive: true, isPublic: true },
        select: {
          id: true,
          title: true,
          slug: true,
          categoryId: true,
          categories: {
            select: { id: true, name: true, slug: true, icon: true, color: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    ),
    dbQuery(() => fetchBrowseTotals(existingKeys)),
  ]);

  return (
    <div className="bg-wibe-surface">
      <Header
        title={`افزودن به ${list.title}`}
        showBack
        showDesktopSearch={false}
        hideTitleOnDesktop
      />
      <AddItemClient
        listId={id}
        listTitle={list.title}
        categories={categories}
        lists={publicLists.map((l) => ({
          ...l,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))}
        initialExistingInList={existingInList}
        initialTotals={totals}
        canRemoveFromList={access.isOwner}
      />
      <BottomNav />
    </div>
  );
}
