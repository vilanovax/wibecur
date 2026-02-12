import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { slugify } from '@/lib/utils/slug';
import { createNotification } from '@/lib/utils/notifications';
import { ensureImageInLiara } from '@/lib/object-storage';

// PUT /api/admin/lists/user-created/[id] - ویرایش/تایید/رد لیست کاربر
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      coverImage,
      categoryId,
      isPublic,
      isActive,
      commentsEnabled,
    } = body;

    // Check if list exists and is user-created
    const existingList = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              role: true,
            },
          },
        },
      })
    );

    if (!existingList) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    if (existingList.users.role !== 'USER') {
      return NextResponse.json(
        { error: 'این لیست توسط کاربر ایجاد نشده است' },
        { status: 403 }
      );
    }

    // Generate new slug if title changed
    let slug = existingList.slug;
    if (title && title !== existingList.title) {
      let baseSlug = slugify(title);
      if (!baseSlug || baseSlug.trim() === '') {
        baseSlug = `list-${Date.now()}`;
      }

      let newSlug = baseSlug;
      let counter = 1;
      let isUnique = false;
      const maxAttempts = 100;

      while (!isUnique && counter < maxAttempts) {
        const existing = await dbQuery(() =>
          prisma.lists.findUnique({
            where: { slug: newSlug },
          })
        );

        if (!existing || existing.id === id) {
          isUnique = true;
          slug = newSlug;
        } else {
          newSlug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
    }

    // Check if title changed
    const titleChanged = title !== undefined && title.trim() !== existingList.title;
    // Check if list will be public (after update or currently)
    const willBePublic = isPublic !== undefined ? isPublic : existingList.isPublic;
    // Notify if title changed AND (list is already public OR will become public)
    const shouldNotify = titleChanged && (existingList.isPublic || willBePublic);

    // Update list
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage ? await ensureImageInLiara(coverImage.trim(), 'covers') : null;
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (commentsEnabled !== undefined) updateData.commentsEnabled = commentsEnabled;
    if (slug !== existingList.slug) updateData.slug = slug;

    const updatedList = await dbQuery(() =>
      prisma.lists.update({
        where: { id },
        data: updateData,
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })
    );

    // Send notification to list owner if title was changed and list is public
    if (shouldNotify) {
      createNotification(
        existingList.userId,
        'admin_message',
        'ویرایش نام لیست',
        `به دلیل نمایش عمومی نام لیست شما، اسامی لیست‌ها باید مناسب انتخاب شوند. نام لیست "${existingList.title}" به "${updatedList.title}" تغییر یافت.`,
        `/user-lists/${updatedList.id}`
      ).catch((error) => {
        console.error('Error creating notification:', error);
        // Don't fail the request if notification fails
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedList,
      message: 'لیست با موفقیت به‌روزرسانی شد',
    });
  } catch (error: any) {
    console.error('Error updating user-created list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در به‌روزرسانی لیست' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/lists/user-created/[id] - حذف لیست کاربر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    // Check if list exists and is user-created
    const existingList = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              role: true,
            },
          },
        },
      })
    );

    if (!existingList) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    if (existingList.users.role !== 'USER') {
      return NextResponse.json(
        { error: 'این لیست توسط کاربر ایجاد نشده است' },
        { status: 403 }
      );
    }

    // Delete list (cascade will handle related data)
    await dbQuery(() =>
      prisma.lists.delete({
        where: { id },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'لیست با موفقیت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting user-created list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در حذف لیست' },
      { status: 500 }
    );
  }
}

