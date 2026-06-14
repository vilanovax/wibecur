import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

/** GET /api/lists/[id]/viewer-state — bookmark + follow در یک درخواست */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: listId } = await params;

    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: { id: true, userId: true, isActive: true, isPublic: true },
      })
    );

    if (!list || !list.isActive || !list.isPublic) {
      return NextResponse.json({ success: false, error: 'List not found' }, { status: 404 });
    }

    const isOwner = list.userId === userId;

    if (isOwner) {
      return NextResponse.json({
        success: true,
        data: { isBookmarked: false, isFollowing: false, isOwner: true },
      });
    }

    const [bookmark, follow] = await Promise.all([
      dbQuery(() =>
        prisma.bookmarks.findUnique({
          where: { userId_listId: { userId, listId } },
          select: { id: true },
        })
      ),
      list.userId
        ? dbQuery(() =>
            prisma.follows.findUnique({
              where: {
                followerId_followingId: {
                  followerId: userId,
                  followingId: list.userId,
                },
              },
              select: { id: true },
            })
          )
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
        isFollowing: !!follow,
        isOwner: false,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching list viewer state:', error);
    return NextResponse.json(
      {
        success: false,
        error: getClientErrorMessage(error, 'خطا در دریافت وضعیت'),
      },
      { status: 500 }
    );
  }
}
