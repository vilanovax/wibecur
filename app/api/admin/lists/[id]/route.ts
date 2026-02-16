import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { ensureImageInLiara } from '@/lib/object-storage';
import { logAudit } from '@/lib/audit/log';
import { getRequestMeta } from '@/lib/audit/request-meta';
import { minimalList } from '@/lib/audit/snapshots';
import type { UserRole } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      description,
      coverImage,
      categoryId,
      badge,
      isPublic,
      isFeatured,
      isActive,
    } = body;

    // Validate required fields
    if (!title || !slug || !categoryId) {
      return NextResponse.json(
        { error: 'عنوان، slug و دسته‌بندی الزامی هستند' },
        { status: 400 }
      );
    }

    // Check if list exists
    const existingList = await prisma.lists.findUnique({
      where: { id },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Check if slug is taken by another list
    if (slug !== existingList.slug) {
      const slugExists = await prisma.lists.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'این slug قبلاً استفاده شده است' },
          { status: 400 }
        );
      }
    }

    const finalCoverImage = coverImage !== undefined ? await ensureImageInLiara(coverImage, 'lists') : undefined;

    const list = await prisma.lists.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        ...(coverImage !== undefined && { coverImage: finalCoverImage }),
        categoryId,
        badge: badge || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'LIST_UPDATE',
      entityType: 'LIST',
      entityId: id,
      before: minimalList(existingList),
      after: minimalList(list),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error updating list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ویرایش لیست' },
      { status: 500 }
    );
  }
}

/** PATCH: فقط به‌روزرسانی isFeatured / isActive برای پنل ادمین */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const body = await request.json();
    const { isFeatured, isActive } = body;

    const existing = await prisma.lists.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }

    const data: { isFeatured?: boolean; isActive?: boolean } = {};
    if (typeof isFeatured === 'boolean') data.isFeatured = isFeatured;
    if (typeof isActive === 'boolean') data.isActive = isActive;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(existing);
    }

    const list = await prisma.lists.update({
      where: { id },
      data,
    });

    const action = typeof isFeatured === 'boolean' && isFeatured !== existing.isFeatured ? 'LIST_BOOST' : 'LIST_UPDATE';
    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action,
      entityType: 'LIST',
      entityId: id,
      before: minimalList(existing),
      after: minimalList(list),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error PATCH list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در به‌روزرسانی' },
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
    const userOrRes = await requirePermission('soft_delete_list');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const existingList = await prisma.lists.findUnique({
      where: { id },
      include: { _count: { select: { bookmarks: true } } },
    });
    if (!existingList) {
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
    }
    if (existingList.deletedAt) {
      return NextResponse.json({ error: 'این لیست قبلاً به زباله‌دان منتقل شده' }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.lists.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedById: userOrRes.id,
        deleteReason: null,
        isActive: false,
      },
    });

    const meta = getRequestMeta(request);
    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'LIST_SOFT_DELETE',
      entityType: 'LIST',
      entityId: id,
      before: minimalList({ ...existingList, _count: existingList._count }),
      after: minimalList(updated),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, message: 'به زباله‌دان منتقل شد' });
  } catch (error: any) {
    console.error('Error soft-deleting list:', error);
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
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;
    const list = await prisma.lists.findUnique({
      where: { id },
      include: {
        categories: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { items: true, list_likes: true, bookmarks: true },
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست' },
      { status: 500 }
    );
  }
}
