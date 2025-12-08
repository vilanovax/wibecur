import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// DELETE /api/user/lists/[id]/items/[itemId] - حذف آیتم از لیست شخصی
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const { id: listId, itemId } = await params;

    // Get user
    // Get user (session.user is guaranteed to exist after the check above)
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: userEmail },
      })
    );

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if list exists and belongs to user
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
      })
    );

    if (!list) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    if (list.userId !== user.id) {
      return NextResponse.json(
        { error: 'شما اجازه حذف آیتم از این لیست را ندارید' },
        { status: 403 }
      );
    }

    // Check if item exists and belongs to this list
    const item = await dbQuery(() =>
      prisma.items.findUnique({
        where: { id: itemId },
      })
    );

    if (!item) {
      return NextResponse.json(
        { error: 'آیتم یافت نشد' },
        { status: 404 }
      );
    }

    if (item.listId !== listId) {
      return NextResponse.json(
        { error: 'این آیتم به این لیست تعلق ندارد' },
        { status: 400 }
      );
    }

    // Delete item and update list itemCount
    await dbQuery(() =>
      prisma.$transaction([
        prisma.items.delete({
          where: { id: itemId },
        }),
        prisma.lists.update({
          where: { id: listId },
          data: {
            itemCount: {
              decrement: 1,
            },
          },
        }),
      ])
    );

    return NextResponse.json({
      success: true,
      message: 'آیتم با موفقیت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting item from list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در حذف آیتم' },
      { status: 500 }
    );
  }
}

