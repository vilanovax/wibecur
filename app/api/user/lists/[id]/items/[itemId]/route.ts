import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { resolveSessionUserId } from '@/lib/api-db';

// DELETE /api/user/lists/[id]/items/[itemId] - حذف آیتم از لیست شخصی
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json(
        { error: 'نشست نامعتبر است؛ لطفاً دوباره وارد شوید' },
        { status: 401 }
      );
    }

    const { id: listId, itemId } = await params;

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

    if (list.userId !== userId) {
      return NextResponse.json(
        { error: 'شما اجازه حذف آیتم از این لیست را ندارید' },
        { status: 403 }
      );
    }

    // placement در همین لیست، یا کپی هم‌کاتالوگ/هم‌عنوان از آیتم مبدأ
    let placement = await dbQuery(() =>
      prisma.items.findFirst({
        where: { id: itemId, listId },
        select: { id: true },
      })
    );

    if (!placement) {
      const source = await dbQuery(() =>
        prisma.items.findUnique({
          where: { id: itemId },
          select: { catalogItemId: true, title: true },
        })
      );
      if (source?.catalogItemId) {
        placement = await dbQuery(() =>
          prisma.items.findFirst({
            where: { listId, catalogItemId: source.catalogItemId },
            select: { id: true },
          })
        );
      } else if (source?.title) {
        placement = await dbQuery(() =>
          prisma.items.findFirst({
            where: {
              listId,
              title: { equals: source.title, mode: 'insensitive' },
            },
            select: { id: true },
          })
        );
      }
    }

    if (!placement) {
      return NextResponse.json(
        { error: 'این آیتم در این لیست نیست' },
        { status: 404 }
      );
    }

    await dbQuery(() =>
      prisma.$transaction([
        prisma.items.delete({
          where: { id: placement!.id },
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
      { error: getClientErrorMessage(error, 'خطا در حذف آیتم') },
      { status: 500 }
    );
  }
}

