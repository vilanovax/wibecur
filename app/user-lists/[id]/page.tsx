import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { getListAccessForUser, getCollaboratorRecord } from '@/lib/list-collaboration';
import UserListDetailClient from './UserListDetailClient';

function loadUserListById(id: string) {
  return dbQuery(() =>
    prisma.lists.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        isPublic: true,
        isActive: true,
        viewCount: true,
        likeCount: true,
        saveCount: true,
        itemCount: true,
        commentsEnabled: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
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
        items: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            externalUrl: true,
            metadata: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        _count: {
          select: {
            items: true,
            list_likes: true,
          },
        },
      },
    })
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id },
        select: { title: true, description: true },
      })
    );

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

export default async function UserListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;

    // auth + list in parallel (async-parallel) — email fallback only if needed.
    const [session, list] = await Promise.all([auth(), loadUserListById(id)]);

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

    if (!list || !list.isActive) {
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

    const listAccess = currentUserId
      ? await dbQuery(() => getListAccessForUser(list, currentUserId))
      : null;

    if (!list.isPublic && !listAccess?.canView) {
      notFound();
    }

    const pendingCollab =
      currentUserId && listAccess && !listAccess.isOwner
        ? await dbQuery(() => getCollaboratorRecord(list.id, currentUserId))
        : null;

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

    return (
      <div className="bg-wibe-surface">
        <Header title={list.title} showBack />
        <UserListDetailClient
          list={list}
          currentUserId={currentUserId}
          canAddItems={listAccess?.canAddItems ?? false}
          isOwner={listAccess?.isOwner ?? isOwner}
          pendingCollaboration={
            pendingCollab?.status === 'PENDING' && pendingCollab.invitedBy
              ? { listId: list.id, invitedBy: pendingCollab.invitedBy }
              : null
          }
        />
        <BottomNav />
      </div>
    );
  } catch {
    notFound();
  }
}
