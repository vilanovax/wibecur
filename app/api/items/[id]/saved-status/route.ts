import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/items/[id]/saved-status - Check if item is saved in user's lists
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { savedInPrivateList: false, savedInPublicList: false, lists: [] },
        { status: 200 }
      );
    }

    const { id: itemId } = await params;

    // Get the item to find its title
    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
        select: { title: true },
      })
    );

    if (!item) {
      return NextResponse.json(
        { error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    // Get user
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { savedInPrivateList: false, savedInPublicList: false, lists: [] },
        { status: 200 }
      );
    }

    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: userEmail },
      })
    );

    if (!user) {
      return NextResponse.json(
        { savedInPrivateList: false, savedInPublicList: false, lists: [] },
        { status: 200 }
      );
    }

    // Find all items with the same title in user's lists
    const savedItems = await dbQuery(() =>
      prisma.items.findMany({
        where: {
          title: {
            equals: item.title,
            mode: 'insensitive',
          },
          lists: {
            userId: user.id,
          },
        },
        include: {
          lists: {
            select: {
              id: true,
              title: true,
              isPublic: true,
            },
          },
        },
      })
    );

    // Determine if saved in private or public lists
    const savedInPrivateList = savedItems.some(
      (item) => !item.lists.isPublic
    );
    const savedInPublicList = savedItems.some(
      (item) => item.lists.isPublic
    );

    const lists = savedItems.map((item) => ({
      id: item.lists.id,
      title: item.lists.title,
      isPublic: item.lists.isPublic,
    }));

    return NextResponse.json({
      savedInPrivateList,
      savedInPublicList,
      lists,
    });
  } catch (error: any) {
    console.error('Error checking saved status:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در بررسی وضعیت ذخیره' },
      { status: 500 }
    );
  }
}
