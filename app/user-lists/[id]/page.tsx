import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';
import ListCommentSection from '@/components/mobile/lists/ListCommentSection';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import UserListDetailClient from './UserListDetailClient';

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
      return {
        title: 'لیست یافت نشد',
      };
    }

    return {
      title: `${list.title} | WibeCur`,
      description: list.description || `مشاهده لیست ${list.title}`,
    };
  } catch (error) {
    return {
      title: 'لیست یافت نشد',
    };
  }
}

export default async function UserListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    let currentUserId = session?.user ? ((session.user as any).id || null) : null;

    // If we have a session but no ID, try to get user ID from email
    if (!currentUserId && session?.user?.email) {
      const userEmail = session.user.email;
      const userFromEmail = await dbQuery(() =>
        prisma.users.findUnique({
          where: { email: userEmail },
          select: { id: true },
        })
      );
      currentUserId = userFromEmail?.id || null;
    }

    console.log('UserListDetailPage - Request:', {
      listId: id,
      hasSession: !!session,
      userId: currentUserId,
      userEmail: session?.user?.email,
      sessionUser: session?.user,
      sessionUserKeys: session?.user ? Object.keys(session.user) : [],
    });

  const list = await dbQuery(() =>
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
          },
        },
      },
    })
  );

  console.log('UserListDetailPage - List found:', {
    listId: list?.id,
    listTitle: list?.title,
    isActive: list?.isActive,
    isPublic: list?.isPublic,
    listUserId: list?.userId,
  });

  if (!list || !list.isActive) {
    console.log('UserListDetailPage - List not found or inactive');
    notFound();
  }

  // Only show lists created by users (not admins)
  const listOwner = await dbQuery(() =>
    prisma.users.findUnique({
      where: { id: list.userId },
      select: { role: true, id: true, email: true },
    })
  );

  console.log('UserListDetailPage - List owner:', {
    found: !!listOwner,
    ownerId: listOwner?.id,
    ownerEmail: listOwner?.email,
    role: listOwner?.role,
    isUser: listOwner?.role === 'USER',
  });

  // For private lists, we should allow viewing even if role is not USER
  // The main check is ownership, not role
  // Only block if it's a public list and owner is admin/editor
  if (list.isPublic && listOwner?.role && listOwner.role !== 'USER') {
    console.log('UserListDetailPage - Public list owner is not a USER, denying access');
    notFound();
  }

  // Only allow viewing private lists if user is the owner
  console.log('UserListDetailPage - Access check:', {
    isPublic: list.isPublic,
    listUserId: list.userId,
    currentUserId,
    userIdsMatch: list.userId === currentUserId,
    canAccess: list.isPublic || list.userId === currentUserId,
  });

  if (!list.isPublic) {
    if (!currentUserId) {
      console.log('UserListDetailPage - Access denied: Private list but no user session');
      notFound();
    }
    if (list.userId !== currentUserId) {
      console.log('UserListDetailPage - Access denied: Private list and user is not owner', {
        listUserId: list.userId,
        currentUserId,
        areEqual: list.userId === currentUserId,
        listUserIdType: typeof list.userId,
        currentUserIdType: typeof currentUserId,
      });
      notFound();
    }
    console.log('UserListDetailPage - Access granted: Private list and user is owner');
  }

  // Increment view count (in background) only for public lists
  if (list.isPublic) {
    dbQuery(() =>
      prisma.lists.update({
        where: { id: list.id },
        data: { viewCount: { increment: 1 } },
      })
    ).catch(console.error);
  }

    return (
      <>
        <UserListDetailClient list={list} currentUserId={currentUserId} />
        <BottomNav />
      </>
    );
  } catch (error: any) {
    console.error('UserListDetailPage - Error:', error);
    console.error('Error stack:', error?.stack);
    notFound();
  }
}

