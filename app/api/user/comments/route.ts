import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET /api/user/comments - دریافت کامنت‌های کاربر
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const comments = await prisma.comments.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            lists: {
              select: {
                slug: true,
              },
            },
          },
          select: {
            id: true,
            title: true,
            lists: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        comments: comments.map((c) => ({
          id: c.id,
          content: c.content,
          isFiltered: c.isFiltered,
          createdAt: c.createdAt.toISOString(),
          items: {
            id: c.items.id,
            title: c.items.title,
            lists: c.items.lists,
          },
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user comments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

