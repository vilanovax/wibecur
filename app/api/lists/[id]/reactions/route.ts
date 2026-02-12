import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';

const REACTION_TYPES = ['love', 'cry', 'night', 'meh', 'suggestion'] as const;
type ReactionType = (typeof REACTION_TYPES)[number];

// GET /api/lists/[id]/reactions - دریافت تعداد واکنش‌ها و واکنش کاربر
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const session = await auth();
    const userId = session?.user ? (session.user as { id: string }).id : null;

    const counts = await dbQuery(() =>
      prisma.list_reactions.groupBy({
        by: ['reactionType'],
        where: { listId },
        _count: { id: true },
      })
    );

    const reactionCounts: Record<string, number> = {
      love: 0,
      cry: 0,
      night: 0,
      meh: 0,
      suggestion: 0,
    };
    counts.forEach((c) => {
      reactionCounts[c.reactionType] = c._count.id;
    });

    let userReaction: string | null = null;
    if (userId) {
      const user = await dbQuery(() =>
        prisma.list_reactions.findUnique({
          where: { userId_listId: { userId, listId } },
          select: { reactionType: true },
        })
      );
      userReaction = user?.reactionType ?? null;
    }

    return NextResponse.json({
      success: true,
      data: {
        counts: reactionCounts,
        userReaction,
      },
    });
  } catch (error: any) {
    console.error('Error fetching list reactions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت واکنش‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/lists/[id]/reactions - ثبت یا تغییر واکنش کاربر
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'برای ثبت واکنش باید وارد شوید' },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const { id: listId } = await params;
    const body = await request.json();
    const { reactionType } = body as { reactionType?: string };

    if (!reactionType || !REACTION_TYPES.includes(reactionType as ReactionType)) {
      return NextResponse.json(
        { success: false, error: 'نوع واکنش نامعتبر است' },
        { status: 400 }
      );
    }

    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        select: { id: true },
      })
    );

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    const existing = await dbQuery(() =>
      prisma.list_reactions.findUnique({
        where: { userId_listId: { userId, listId } },
      })
    );

    if (existing) {
      if (existing.reactionType === reactionType) {
        // حذف واکنش (toggle off)
        await dbQuery(() =>
          prisma.list_reactions.delete({
            where: { userId_listId: { userId, listId } },
          })
        );
        const counts = await getCounts(listId);
        return NextResponse.json({
          success: true,
          data: {
            userReaction: null,
            counts,
          },
        });
      }
      await dbQuery(() =>
        prisma.list_reactions.update({
          where: { userId_listId: { userId, listId } },
          data: { reactionType },
        })
      );
    } else {
      await dbQuery(() =>
        prisma.list_reactions.create({
          data: {
            id: nanoid(),
            listId,
            userId,
            reactionType,
          },
        })
      );
    }

    const counts = await getCounts(listId);
    return NextResponse.json({
      success: true,
      data: {
        userReaction: reactionType,
        counts,
      },
    });
  } catch (error: any) {
    console.error('Error setting list reaction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در ثبت واکنش' },
      { status: 500 }
    );
  }
}

async function getCounts(listId: string) {
  const counts = await dbQuery(() =>
    prisma.list_reactions.groupBy({
      by: ['reactionType'],
      where: { listId },
      _count: { id: true },
    })
  );
  const result: Record<string, number> = {
    love: 0,
    cry: 0,
    night: 0,
    meh: 0,
    suggestion: 0,
  };
  counts.forEach((c) => {
    result[c.reactionType] = c._count.id;
  });
  return result;
}
