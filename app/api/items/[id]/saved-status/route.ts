import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { resolveSessionUserId } from '@/lib/api-db';

type SavedListRef = {
  id: string;
  title: string;
  isPublic: boolean;
  placementItemId: string;
};

const EMPTY = {
  savedInPrivateList: false,
  savedInPublicList: false,
  lists: [] as SavedListRef[],
};

/** GET /api/items/[id]/saved-status — وضعیت ذخیره در لیست‌های شخصی کاربر */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(EMPTY, { status: 200 });
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json(EMPTY, { status: 200 });
    }

    const { id: itemId } = await params;

    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        select: { title: true, catalogItemId: true },
      })
    );

    if (!item) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    const savedItems = await dbQuery(() =>
      prisma.items.findMany({
        where: item.catalogItemId
          ? { catalogItemId: item.catalogItemId, lists: { userId } }
          : {
              title: { equals: item.title, mode: 'insensitive' },
              lists: { userId },
            },
        select: {
          id: true,
          lists: { select: { id: true, title: true, isPublic: true } },
        },
      })
    );

    const lists: SavedListRef[] = savedItems.map((row) => ({
      id: row.lists.id,
      title: row.lists.title,
      isPublic: row.lists.isPublic,
      placementItemId: row.id,
    }));

    return NextResponse.json({
      savedInPrivateList: lists.some((l) => !l.isPublic),
      savedInPublicList: lists.some((l) => l.isPublic),
      lists,
    });
  } catch (error: unknown) {
    console.error('Error checking saved status:', error);
    return NextResponse.json(
      { error: getClientErrorMessage(error, 'خطا در بررسی وضعیت ذخیره') },
      { status: 500 }
    );
  }
}
