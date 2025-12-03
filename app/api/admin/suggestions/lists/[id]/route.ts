import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/utils/slug';
import { createNotification } from '@/lib/utils/notifications';

// PUT /api/admin/suggestions/lists/[id] - تایید یا رد پیشنهاد لیست
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { action, title, description, coverImage, adminNotes } = body;

    // action: 'approve' | 'reject' | 'edit'
    if (!['approve', 'reject', 'edit'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'عملیات نامعتبر است' },
        { status: 400 }
      );
    }

    const suggestedList = await dbQuery(() =>
      prisma.suggested_lists.findUnique({
        where: { id },
        include: {
          categories: true,
          users: true,
        },
      })
    );

    if (!suggestedList) {
      return NextResponse.json(
        { success: false, error: 'پیشنهاد یافت نشد' },
        { status: 404 }
      );
    }

    // Allow editing regardless of status, but approve/reject only for pending
    if (action !== 'edit' && suggestedList.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'این پیشنهاد قبلاً بررسی شده است' },
        { status: 400 }
      );
    }

    if (action === 'edit') {
      // Edit suggestion without changing status
      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }
      if (coverImage !== undefined) {
        updateData.coverImage = coverImage?.trim() || null;
      }

      await dbQuery(() =>
        prisma.suggested_lists.update({
          where: { id },
          data: updateData,
        })
      );

      // Send notification if adminNotes provided
      if (adminNotes && adminNotes.trim()) {
        await createNotification(
          suggestedList.userId,
          'suggestion_updated',
          'پیشنهاد لیست شما ویرایش شد',
          adminNotes.trim(),
          null
        );
      }

      return NextResponse.json({
        success: true,
        message: 'پیشنهاد با موفقیت ویرایش شد',
      });
    } else if (action === 'approve') {
      // Generate slug from title
      const listTitle = (title || suggestedList.title).trim();
      
      if (!listTitle) {
        return NextResponse.json(
          { success: false, error: 'عنوان لیست الزامی است' },
          { status: 400 }
        );
      }
      
      let baseSlug = slugify(listTitle);
      
      // Fallback if slug is empty (e.g., for Persian text that gets removed by slugify)
      if (!baseSlug || baseSlug.trim() === '') {
        // Use timestamp as fallback
        baseSlug = `list-${Date.now()}`;
      }
      
      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (true) {
        const existing = await dbQuery(() =>
          prisma.lists.findUnique({
            where: { slug },
          })
        );
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
        // Safety limit
        if (counter > 1000) {
          slug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }

      // Create actual list
      const newList = await dbQuery(() =>
        prisma.lists.create({
          data: {
            id: nanoid(),
            title: title || suggestedList.title,
            slug,
            description: description !== undefined ? description : suggestedList.description,
            coverImage: coverImage !== undefined ? coverImage : suggestedList.coverImage,
            categoryId: suggestedList.categoryId,
            userId: suggestedList.userId, // Keep original user who suggested
            isPublic: true,
            isFeatured: false,
            isActive: true,
          },
        })
      );

      // Update suggested list status
      await dbQuery(() =>
        prisma.suggested_lists.update({
          where: { id },
          data: {
            status: 'approved',
            adminNotes: adminNotes || null,
          },
        })
      );

      // Create notification for user
      const notificationMessage = adminNotes?.trim() || 
        `با تشکر از پیشنهاد شما! لیست "${newList.title}" با موفقیت ایجاد و منتشر شد.`;
      
      await createNotification(
        suggestedList.userId,
        'suggestion_approved',
        'پیشنهاد لیست شما تایید شد',
        notificationMessage,
        `/lists/${newList.slug}`
      );

      return NextResponse.json({
        success: true,
        message: 'پیشنهاد با موفقیت تایید و لیست ایجاد شد',
        data: newList,
      });
    } else {
      // Reject
      if (!adminNotes || !adminNotes.trim()) {
        return NextResponse.json(
          { success: false, error: 'لطفاً دلیل رد را وارد کنید' },
          { status: 400 }
        );
      }

      await dbQuery(() =>
        prisma.suggested_lists.update({
          where: { id },
          data: {
            status: 'rejected',
            adminNotes: adminNotes.trim(),
          },
        })
      );

      // Create notification for user
      await createNotification(
        suggestedList.userId,
        'suggestion_rejected',
        'پیشنهاد لیست شما رد شد',
        `متأسفانه پیشنهاد لیست "${suggestedList.title}" رد شد. دلیل: ${adminNotes.trim()}`,
        null
      );

      return NextResponse.json({
        success: true,
        message: 'پیشنهاد رد شد',
      });
    }
  } catch (error: any) {
    console.error('Error updating suggested list:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در بروزرسانی پیشنهاد' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/suggestions/lists/[id] - حذف پیشنهاد لیست
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const message = searchParams.get('message') || '';

    const suggestedList = await dbQuery(() =>
      prisma.suggested_lists.findUnique({
        where: { id },
        include: {
          users: true,
        },
      })
    );

    if (!suggestedList) {
      return NextResponse.json(
        { success: false, error: 'پیشنهاد یافت نشد' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending suggestions
    if (suggestedList.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'فقط پیشنهادات در انتظار بررسی قابل حذف هستند' },
        { status: 400 }
      );
    }

    // Send notification to user if message provided
    if (message && message.trim()) {
      await createNotification(
        suggestedList.userId,
        'suggestion_deleted',
        'پیشنهاد لیست شما حذف شد',
        message.trim(),
        null
      );
    }

    // Delete the suggestion
    await dbQuery(() =>
      prisma.suggested_lists.delete({
        where: { id },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'پیشنهاد با موفقیت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting suggested list:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در حذف پیشنهاد' },
      { status: 500 }
    );
  }
}

