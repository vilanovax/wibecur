import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, requireAdminUser } from '@/lib/auth/require-permission';
import { restoreItems } from '@/lib/admin/item-trash';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import type { UserRole } from '@prisma/client';
import { revalidateAdminListsAndCategoriesCache } from '@/lib/admin/admin-cache';
import type { TrashEntity } from '@/lib/admin/trash-hub';

type BulkAction = 'restore';

type BulkBody = {
  entity: TrashEntity;
  action: BulkAction;
  ids: string[];
};

const MAX_BULK = 100;

/** POST: عملیات گروهی روی زباله‌دان (بازگردانی) */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BulkBody;
    const entity = body.entity;
    const action = body.action;
    const ids = [...new Set((body.ids ?? []).filter(Boolean))];

    if (!entity || !['lists', 'categories', 'items'].includes(entity)) {
      return NextResponse.json({ error: 'نوع موجودیت نامعتبر' }, { status: 400 });
    }
    if (action !== 'restore') {
      return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: 'هیچ موردی انتخاب نشده' }, { status: 400 });
    }
    if (ids.length > MAX_BULK) {
      return NextResponse.json(
        { error: `حداکثر ${MAX_BULK.toLocaleString('fa-IR')} مورد در هر عملیات` },
        { status: 400 }
      );
    }

    const meta = getRequestMeta(request);
    let processed = 0;

    if (entity === 'lists') {
      const userOrRes = await requirePermission('soft_delete_list');
      if (userOrRes instanceof NextResponse) return userOrRes;

      const rows = await prisma.lists.findMany({
        where: { id: { in: ids }, deletedAt: { not: null } },
        select: { id: true, title: true },
      });

      for (const row of rows) {
        await prisma.lists.update({
          where: { id: row.id },
          data: {
            deletedAt: null,
            deletedById: null,
            deleteReason: null,
            isActive: true,
          },
        });
        await logAudit({
          actorId: userOrRes.id,
          actorRole: userOrRes.role as UserRole,
          action: 'LIST_RESTORE',
          entityType: 'LIST',
          entityId: row.id,
          after: { title: row.title },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });
        processed += 1;
      }
      revalidateAdminListsAndCategoriesCache();
    } else if (entity === 'categories') {
      const userOrRes = await requirePermission('manage_categories');
      if (userOrRes instanceof NextResponse) return userOrRes;

      const rows = await prisma.categories.findMany({
        where: { id: { in: ids }, deletedAt: { not: null } },
        select: { id: true, name: true },
      });

      for (const row of rows) {
        await prisma.categories.update({
          where: { id: row.id },
          data: {
            deletedAt: null,
            deletedById: null,
            deleteReason: null,
          },
        });
        await logAudit({
          actorId: userOrRes.id,
          actorRole: userOrRes.role as UserRole,
          action: 'CATEGORY_RESTORE',
          entityType: 'CATEGORY',
          entityId: row.id,
          after: { name: row.name },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });
        processed += 1;
      }
      revalidateAdminListsAndCategoriesCache();
    } else {
      const userOrRes = await requireAdminUser();
      if (userOrRes instanceof NextResponse) return userOrRes;

      const rows = await prisma.items.findMany({
        where: { id: { in: ids }, deletedAt: { not: null } },
        select: { id: true, title: true },
      });

      processed = await restoreItems(
        prisma,
        rows.map((r) => r.id)
      );

      for (const row of rows.slice(0, processed)) {
        await logAudit({
          actorId: userOrRes.id,
          actorRole: userOrRes.role as UserRole,
          action: 'ITEM_RESTORE',
          entityType: 'ITEM',
          entityId: row.id,
          after: { title: row.title },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });
      }
    }

    const skipped = ids.length - processed;
    return NextResponse.json({
      success: true,
      processed,
      skipped,
      message: `${processed.toLocaleString('fa-IR')} مورد بازگردانی شد${skipped > 0 ? ` · ${skipped.toLocaleString('fa-IR')} رد شد` : ''}`,
    });
  } catch (error: unknown) {
    console.error('admin trash bulk:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در عملیات گروهی' },
      { status: 500 }
    );
  }
}
