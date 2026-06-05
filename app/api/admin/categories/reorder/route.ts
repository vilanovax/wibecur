import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { revalidateAdminListsAndCategoriesCache } from '@/lib/admin/admin-cache';

/** PUT — به‌روزرسانی ترتیب نمایش دسته‌ها */
export async function PUT(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_categories');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const orderedIds = body?.orderedIds as unknown;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'لیست شناسه‌ها نامعتبر است' }, { status: 400 });
    }

    if (!orderedIds.every((id) => typeof id === 'string' && id.length > 0)) {
      return NextResponse.json({ error: 'شناسه‌های نامعتبر' }, { status: 400 });
    }

    const existing = await prisma.categories.findMany({
      where: { id: { in: orderedIds }, deletedAt: null },
      select: { id: true },
    });

    if (existing.length !== orderedIds.length) {
      return NextResponse.json(
        { error: 'برخی دسته‌ها یافت نشدند یا حذف شده‌اند' },
        { status: 400 }
      );
    }

    const now = new Date();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.categories.update({
          where: { id },
          data: { order: index, updatedAt: now },
        })
      )
    );

    revalidateAdminListsAndCategoriesCache();
    return NextResponse.json({ success: true, count: orderedIds.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ذخیره ترتیب';
    console.error('Category reorder error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
