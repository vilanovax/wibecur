import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalCategory } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_categories');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    const body = await request.json();
    const { name, slug, icon, color, description, order, isActive, commentsEnabled } = body;

    // Validate required fields
    if (!name || !slug || !icon) {
      return NextResponse.json(
        { error: 'نام، slug و آیکون الزامی هستند' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    // Check if slug is taken by another category
    if (slug !== existingCategory.slug) {
      const slugExists = await prisma.categories.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'این slug قبلاً استفاده شده است' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.categories.update({
      where: { id },
      data: {
        name,
        slug,
        icon,
        color: color || '#6366F1',
        description,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : true,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'CATEGORY_UPDATE',
      entityType: 'CATEGORY',
      entityId: id,
      before: minimalCategory(existingCategory),
      after: minimalCategory(category),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ویرایش دسته‌بندی' },
      { status: 500 }
    );
  }
}

/** DELETE = انتقال به زباله‌دان (soft delete). در MVP حذف دائمی نداریم. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_categories');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;

    const existingCategory = await prisma.categories.findUnique({
      where: { id },
      include: { _count: { select: { lists: true } } },
    });
    if (!existingCategory) {
      return NextResponse.json({ error: 'دسته‌بندی یافت نشد' }, { status: 404 });
    }
    if (existingCategory.deletedAt) {
      return NextResponse.json({ error: 'این دسته قبلاً به زباله‌دان منتقل شده' }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.categories.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedById: userOrRes.id,
        deleteReason: null,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'CATEGORY_SOFT_DELETE',
      entityType: 'CATEGORY',
      entityId: id,
      before: minimalCategory(existingCategory),
      after: minimalCategory(updated),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, message: 'به زباله‌دان منتقل شد' });
  } catch (error: any) {
    console.error('Error soft-deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در انتقال به زباله‌دان' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lists: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی' },
      { status: 500 }
    );
  }
}
