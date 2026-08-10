import { Suspense } from 'react';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { getListAccessForUser } from '@/lib/list-collaboration';
import {
  getUserListById,
  prepareUserListForClient,
} from '@/lib/user-list-detail';
import UserListDetailClient from './UserListDetailClient';
import UserListDetailSkeleton from '@/components/mobile/user-lists/UserListDetailSkeleton';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const list = await getUserListById(id);

    if (!list) {
      return { title: 'لیست یافت نشد' };
    }

    return {
      title: `${list.title} | WibeCur`,
      description: list.description || `مشاهده لیست ${list.title}`,
    };
  } catch {
    return { title: 'لیست یافت نشد' };
  }
}

async function UserListDetailContent({ id }: { id: string }) {
  try {
    // auth + list in parallel (async-parallel)
    const [session, list] = await Promise.all([auth(), getUserListById(id)]);

    let currentUserId = session?.user?.id ?? null;
    if (!currentUserId && session?.user?.email) {
      const userFromEmail = await dbQuery(() =>
        prisma.users.findUnique({
          where: { email: session.user!.email! },
          select: { id: true },
        })
      );
      currentUserId = userFromEmail?.id ?? null;
    }

    if (!list || !list.isActive || list.deletedAt) {
      notFound();
    }

    const ownerRole = list.users?.role;
    const isOwner = currentUserId === list.userId;

    // Public curated/admin lists stay on /lists/[slug]; block here unless owner.
    if (list.isPublic && ownerRole && ownerRole !== 'USER' && !isOwner) {
      notFound();
    }

    if (!list.isPublic && !currentUserId) {
      notFound();
    }

    // Owner short-circuit inside getListAccessForUser (no collab query)
    const listAccess = currentUserId
      ? await dbQuery(() => getListAccessForUser(list, currentUserId))
      : null;

    if (!list.isPublic && !listAccess?.canView) {
      notFound();
    }

    if (list.isPublic) {
      after(() => {
        dbQuery(() =>
          prisma.lists.update({
            where: { id: list.id },
            data: { viewCount: { increment: 1 } },
          })
        ).catch(() => {});
      });
    }

    const totalItems = list.itemCount ?? list._count.items;
    const prepared = prepareUserListForClient(list);
    // Drop unused owner fields from client payload (server-serialization)
    const { users: _users, deletedAt: _deletedAt, ...listForClient } = prepared;

    return (
      <>
        <Header title={list.title} showBack />
        <UserListDetailClient
          list={listForClient}
          currentUserId={currentUserId}
          canAddItems={listAccess?.canAddItems ?? false}
          isOwner={listAccess?.isOwner ?? isOwner}
          itemsHasMore={totalItems > listForClient.items.length}
          itemsTotal={totalItems}
          pendingCollaboration={listAccess?.pendingCollaboration ?? null}
        />
      </>
    );
  } catch {
    notFound();
  }
}

export default async function UserListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="bg-wibe-surface">
      <Suspense
        fallback={
          <>
            <Header title="لیست" showBack />
            <UserListDetailSkeleton />
          </>
        }
      >
        <UserListDetailContent id={id} />
      </Suspense>
      <BottomNav />
    </div>
  );
}
