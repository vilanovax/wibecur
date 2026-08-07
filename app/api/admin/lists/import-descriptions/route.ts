import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalList } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';
import { revalidateAdminListsAndCategoriesCache } from '@/lib/admin/admin-cache';
import { parseListDescriptionImportPayload } from '@/lib/admin/list-description-import';

/** POST /api/admin/lists/import-descriptions — ورود JSON توضیحات از هوش مصنوعی خارجی */
export async function POST(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const payload = parseListDescriptionImportPayload(body);

    const ids = payload.lists.map((item) => item.id?.trim()).filter(Boolean) as string[];
    const slugs = payload.lists.map((item) => item.slug?.trim()).filter(Boolean) as string[];

    const existingLists = await prisma.lists.findMany({
      where: {
        deletedAt: null,
        OR: [
          ...(ids.length > 0 ? [{ id: { in: ids } }] : []),
          ...(slugs.length > 0 ? [{ slug: { in: slugs } }] : []),
        ],
      },
      select: {
        id: true,
        slug: true,
        description: true,
        title: true,
        categoryId: true,
        isActive: true,
        isFeatured: true,
        badge: true,
        updatedAt: true,
      },
    });

    const byId = new Map(existingLists.map((list) => [list.id, list]));
    const bySlug = new Map(existingLists.map((list) => [list.slug, list]));

    let updated = 0;
    const errors: string[] = [];
    const meta = getRequestMeta(request);

    for (const item of payload.lists) {
      const key = item.id?.trim() || item.slug?.trim() || '';
      const existing =
        (item.id?.trim() ? byId.get(item.id.trim()) : undefined) ||
        (item.slug?.trim() ? bySlug.get(item.slug.trim()) : undefined);

      if (!existing) {
        errors.push(`${key || '؟'}: لیست یافت نشد`);
        continue;
      }

      const nextDescription = item.description?.trim() || null;
      if ((existing.description ?? null) === nextDescription) continue;

      try {
        const list = await prisma.lists.update({
          where: { id: existing.id },
          data: { description: nextDescription },
        });
        updated += 1;

        await logAudit({
          actorId: userOrRes.id,
          actorRole: userOrRes.role as UserRole,
          action: 'LIST_UPDATE',
          entityType: 'LIST',
          entityId: existing.id,
          before: minimalList(existing),
          after: minimalList(list),
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });
      } catch (err: unknown) {
        errors.push(
          `${existing.title}: ${err instanceof Error ? err.message : 'خطا در به‌روزرسانی'}`
        );
      }
    }

    if (updated > 0) {
      revalidateAdminListsAndCategoriesCache();
    }

    return NextResponse.json({
      success: true,
      data: { updated, skipped: payload.lists.length - updated - errors.length, failed: errors.length, errors: errors.slice(0, 15) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ورود JSON';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
