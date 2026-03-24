import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';

// GET /api/user/my-lists - دریافت لیست‌های کاربر
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
    const filter = searchParams.get('filter') || 'all'; // all | public | private | draft

    const where: { userId: string; isPublic?: boolean; isActive?: boolean } = { userId };
    if (filter === 'public') where.isPublic = true;
    else if (filter === 'private') where.isPublic = false;
    else if (filter === 'draft') where.isActive = false;

    let lists: Array<Record<string, unknown>>;
    let total: number;

    try {
      const [listsResult, totalResult] = await Promise.all([
        prisma.lists.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }, { updatedAt: 'desc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            coverImage: true,
            categoryId: true,
            userId: true,
            tags: true,
            badge: true,
            isPublic: true,
            isFeatured: true,
            isActive: true,
            likeCount: true,
            viewCount: true,
            saveCount: true,
            itemCount: true,
            commentsEnabled: true,
            createdAt: true,
            updatedAt: true,
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
        }),
        prisma.lists.count({ where }),
      ]);
      lists = listsResult;
      total = totalResult;
    } catch (dbError: unknown) {
      console.error('Error fetching user lists (DB):', dbError);
      return NextResponse.json({
        success: true,
        data: {
          lists: [],
          pagination: { page: 1, limit, total: 0, totalPages: 0 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        lists,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching user lists:', err.message);
    return NextResponse.json({
      success: true,
      data: {
        lists: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    });
  }
}

