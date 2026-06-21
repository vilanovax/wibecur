import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalCategory } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';
import { revalidateAdminListsAndCategoriesCache } from '@/lib/admin/admin-cache';
import {
  formatCategoryTrashMessage,
  trashCategoryWithContents,
} from '@/lib/admin/category-trash';

/** POST: انتقال به زباله‌دان (soft delete) — لیست‌ها و آیتم‌ها هم منتقل می‌شوند */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_categories');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason : undefined;

    const existing = await prisma.categories.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            lists: { where: { deletedAt: null } },
          },
        },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }
    if (existing.deletedAt) {
      return NextResponse.json({ error: 'این دسته قبلاً به زباله‌دان منتقل شده' }, { status: 400 });
    }

    const cascade = await trashCategoryWithContents(prisma, id, userOrRes.id, reason);

    const updated = await prisma.categories.findUnique({ where: { id } });
    if (!updated) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'CATEGORY_SOFT_DELETE',
      entityType: 'CATEGORY',
      entityId: id,
      before: minimalCategory(existing),
      after: {
        ...minimalCategory(updated),
        listsTrashed: cascade.listsTrashed,
        itemsTrashed: cascade.itemsTrashed,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    revalidateAdminListsAndCategoriesCache();
    return NextResponse.json({
      success: true,
      message: formatCategoryTrashMessage(cascade),
      listCount: existing._count?.lists ?? 0,
      listsTrashed: cascade.listsTrashed,
      itemsTrashed: cascade.itemsTrashed,
    });
  } catch (err: unknown) {
    console.error('Category trash error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'خطا در انتقال به زباله‌دان' },
      { status: 500 }
    );
  }
}
