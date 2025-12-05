import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/lists/user-created - دریافت لیست‌های عمومی کاربران (نه ادمین)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest'; // newest, popular, mostViewed
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isPublic: true,
      isActive: true,
      users: {
        role: 'USER', // Only show lists created by regular users, not admins
      },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { likeCount: 'desc' };
    } else if (sort === 'mostViewed') {
      orderBy = { viewCount: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [totalCount, lists] = await Promise.all([
      dbQuery(() =>
        prisma.lists.count({
          where,
        })
      ),
      dbQuery(() =>
        prisma.lists.findMany({
          where,
          skip,
          take: limit,
          orderBy,
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
    ]);

    // Serialize dates
    const serializedLists = lists.map((list) => ({
      ...list,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedLists,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user-created lists:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}

