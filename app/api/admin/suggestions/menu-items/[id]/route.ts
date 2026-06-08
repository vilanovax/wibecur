import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { createNotification } from '@/lib/utils/notifications';
import {
  addCatalogItemToList,
  createCatalogItem,
  isCatalogInList,
} from '@/lib/catalog-items';

/** PUT /api/admin/suggestions/menu-items/[id] — تأیید/رد پیشنهاد منوی سه‌نقطه */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { action, adminNotes } = body as { action?: string; adminNotes?: string };

    if (!['approve', 'reject'].includes(action ?? '')) {
      return NextResponse.json({ success: false, error: 'عملیات نامعتبر است' }, { status: 400 });
    }

    const comment = await dbQuery(() =>
      prisma.list_comments.findUnique({
        where: { id },
        include: {
          lists: {
            select: {
              id: true,
              title: true,
              slug: true,
              itemCount: true,
              categories: { select: { slug: true } },
            },
          },
        },
      })
    );

    if (!comment || comment.type !== 'suggestion' || comment.deletedAt) {
      return NextResponse.json({ success: false, error: 'پیشنهاد یافت نشد' }, { status: 404 });
    }

    if (comment.suggestionStatus !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'این پیشنهاد قبلاً بررسی شده است' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const title = comment.content.trim();
      if (!title) {
        return NextResponse.json({ success: false, error: 'عنوان پیشنهاد خالی است' }, { status: 400 });
      }

      const categorySlug = comment.lists.categories?.slug ?? null;

      const catalog = await dbQuery(() =>
        createCatalogItem(prisma, {
          title,
          description: null,
          imageUrl: null,
          externalUrl: null,
          categorySlug,
          metadata: {},
        })
      );

      if (await isCatalogInList(prisma, catalog.id, comment.listId)) {
        return NextResponse.json(
          { success: false, error: 'این آیتم قبلاً در لیست وجود دارد' },
          { status: 409 }
        );
      }

      const newItem = await dbQuery(() =>
        addCatalogItemToList(prisma, {
          catalogItemId: catalog.id,
          listId: comment.listId,
          order: comment.lists.itemCount,
        })
      );

      await dbQuery(() =>
        prisma.$transaction([
          prisma.list_comments.update({
            where: { id },
            data: {
              suggestionStatus: 'approved',
              approvedItemId: newItem.id,
              updatedAt: new Date(),
            },
          }),
          prisma.users.update({
            where: { id: comment.userId },
            data: { reputationScore: { increment: 2 }, updatedAt: new Date() },
          }),
        ])
      );

      await createNotification(
        comment.userId,
        'suggestion_approved',
        'پیشنهاد آیتم شما تایید شد',
        adminNotes?.trim() ||
          `با تشکر از پیشنهاد شما! «${newItem.title}» به لیست «${comment.lists.title}» اضافه شد.`,
        `/lists/${comment.lists.slug}`
      );

      return NextResponse.json({
        success: true,
        message: 'پیشنهاد تأیید و آیتم ایجاد شد',
        data: newItem,
      });
    }

    if (!adminNotes?.trim()) {
      return NextResponse.json(
        { success: false, error: 'لطفاً دلیل رد را وارد کنید' },
        { status: 400 }
      );
    }

    await dbQuery(() =>
      prisma.list_comments.update({
        where: { id },
        data: {
          suggestionStatus: 'rejected',
          updatedAt: new Date(),
        },
      })
    );

    await createNotification(
      comment.userId,
      'suggestion_rejected',
      'پیشنهاد آیتم شما رد شد',
      `پیشنهاد «${comment.content.trim()}» رد شد. دلیل: ${adminNotes.trim()}`,
      undefined
    );

    return NextResponse.json({ success: true, message: 'پیشنهاد رد شد' });
  } catch (error: unknown) {
    console.error('admin menu-item suggestion:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}

/** DELETE — حذف پیشنهاد منو (soft) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const comment = await dbQuery(() =>
      prisma.list_comments.findUnique({ where: { id } })
    );

    if (!comment || comment.type !== 'suggestion') {
      return NextResponse.json({ success: false, error: 'پیشنهاد یافت نشد' }, { status: 404 });
    }

    if (comment.suggestionStatus !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'فقط پیشنهادات در انتظار قابل حذف هستند' },
        { status: 400 }
      );
    }

    await dbQuery(() =>
      prisma.list_comments.update({
        where: { id },
        data: { deletedAt: new Date(), updatedAt: new Date() },
      })
    );

    return NextResponse.json({ success: true, message: 'پیشنهاد حذف شد' });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
