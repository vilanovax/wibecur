import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';

// GET /api/user/bookmarks - دریافت بوکمارک‌های کاربر
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmarks.findMany({
        where: { userId },
        skip,
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
              _count: {
                select: {
                  items: true,
                  list_likes: true,
                  bookmarks: true,
                },
              },
            },
          },
        },
      }),
      prisma.bookmarks.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        bookmarks: bookmarks.map((b) => ({
          id: b.id,
          list: b.lists,
          createdAt: b.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

