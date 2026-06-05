import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { nanoid } from 'nanoid';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalCategory } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';
import { revalidateAdminListsAndCategoriesCache } from '@/lib/admin/admin-cache';

async function uniqueSlug(baseSlug: string): Promise<string> {
  const root = baseSlug.replace(/-copy(-\d+)?$/, '');
  let candidate = `${root}-copy`;
  let n = 2;
  while (await prisma.categories.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-copy-${n}`;
    n += 1;
  }
  return candidate;
}

/** POST: کپی متادیتای دسته (بدون لیست‌ها) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_categories');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    const source = await prisma.categories.findUnique({ where: { id } });

    if (!source) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }
    if (source.deletedAt) {
      return NextResponse.json(
        { error: 'دسته حذف‌شده را نمی‌توان کپی کرد — ابتدا بازیابی کنید' },
        { status: 400 }
      );
    }

    const slug = await uniqueSlug(source.slug);
    const maxOrder = await prisma.categories.aggregate({
      where: { deletedAt: null },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const copyName = source.name.includes('(کپی)')
      ? `${source.name.replace(/\s*\(کپی\)\s*$/, '')} (کپی ۲)`
      : `${source.name} (کپی)`;

    const created = await prisma.categories.create({
      data: {
        id: nanoid(),
        name: copyName,
        slug,
        icon: source.icon,
        color: source.color,
        accentColor: source.accentColor,
        description: source.description,
        heroImage: source.heroImage,
        layoutType: source.layoutType,
        order: nextOrder,
        isActive: false,
        commentsEnabled: source.commentsEnabled,
        trendingWeight: 1,
        updatedAt: new Date(),
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'CATEGORY_CREATE',
      entityType: 'CATEGORY',
      entityId: created.id,
      before: { duplicatedFrom: source.id, sourceSlug: source.slug },
      after: minimalCategory(created),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    revalidateAdminListsAndCategoriesCache();
    return NextResponse.json(
      {
        id: created.id,
        slug: created.slug,
        name: created.name,
        message: 'کپی دسته ایجاد شد — غیرفعال است تا ویرایش کنید',
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Category duplicate error:', err);
    return NextResponse.json({ error: 'خطا در کپی دسته‌بندی' }, { status: 500 });
  }
}
