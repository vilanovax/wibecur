import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';

// GET /api/user/activity - دریافت فعالیت‌های کاربر
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const activities: any[] = [];

    // دریافت لیست‌های کاربر
    if (type === 'all' || type === 'lists') {
      const userLists = await prisma.lists.findMany({
        where: { userId },
        take: limit,
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
        },
      });

      userLists.forEach((list) => {
        activities.push({
          id: `list-${list.id}`,
          type: 'list_created',
          title: list.title,
          description: list.description || '',
          image: list.coverImage,
          slug: list.slug,
          category: list.categories,
          createdAt: list.createdAt,
        });
      });
    }

    // دریافت بوکمارک‌ها
    if (type === 'all' || type === 'bookmarks') {
      const bookmarks = await prisma.bookmarks.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lists: {
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
            },
          },
        },
      });

      bookmarks.forEach((bookmark) => {
        activities.push({
          id: `bookmark-${bookmark.id}`,
          type: 'bookmark',
          title: bookmark.lists.title,
          description: bookmark.lists.description || '',
          image: bookmark.lists.coverImage,
          slug: bookmark.lists.slug,
          category: bookmark.lists.categories,
          createdAt: bookmark.createdAt,
        });
      });
    }

    // دریافت لایک‌های آیتم‌ها (نه لیست‌ها)
    if (type === 'all' || type === 'likes') {
      const itemLikes = await prisma.item_votes.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              lists: {
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
                },
              },
            },
          },
        },
      });

      itemLikes.forEach((like) => {
        activities.push({
          id: `item-like-${like.id}`,
          type: 'item_like',
          title: like.items.title,
          description: like.items.description || '',
          image: like.items.imageUrl,
          itemId: like.items.id,
          slug: like.items.lists.slug, // لیست مربوطه
          category: like.items.lists.categories,
          createdAt: like.createdAt,
        });
      });
    }

    // مرتب‌سازی بر اساس تاریخ
    activities.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      data: {
        activities: activities.slice(0, limit),
        total: activities.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

