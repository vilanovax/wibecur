import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/admin/lists/user-created - دریافت لیست‌های کاربران
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, bad_words, public, inactive
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Get bad words for filtering
    let badWordsList: string[] = [];
    try {
      const badWords = await dbQuery(() =>
        prisma.bad_words.findMany({
          select: { word: true },
        })
      );
      badWordsList = badWords.map((bw) => bw.word.toLowerCase());
    } catch (err) {
      console.warn('Could not fetch bad words:', err);
    }

    // Build where clause
    const where: any = {
      users: {
        role: 'USER', // Only user-created lists
      },
    };

    if (filter === 'bad_words') {
      // Lists with bad words in title
      if (badWordsList.length > 0) {
        where.OR = badWordsList.map((word) => ({
          title: {
            contains: word,
            mode: 'insensitive',
          },
        }));
      } else {
        // No bad words defined, return empty
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        });
      }
    } else if (filter === 'public') {
      where.isPublic = true;
      where.isActive = true;
    } else if (filter === 'inactive') {
      where.isActive = false;
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
    ]);

    // Mark lists with bad words
    const processedLists = lists.map((list) => {
      let hasBadWord = false;
      if (badWordsList.length > 0) {
        const titleLower = list.title.toLowerCase();
        hasBadWord = badWordsList.some((word) => titleLower.includes(word));
      }

      return {
        ...list,
        hasBadWord,
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: processedLists,
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

