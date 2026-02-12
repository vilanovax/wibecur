import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { createNotification, notifyListBookmarkers } from '@/lib/utils/notifications';
import { ensureImageInLiara } from '@/lib/object-storage';

// PUT /api/admin/suggestions/items/[id] - تایید یا رد پیشنهاد آیتم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { action, title, description, imageUrl, externalUrl, metadata, adminNotes } = body;

    // action: 'approve' | 'reject' | 'edit'
    if (!['approve', 'reject', 'edit'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'عملیات نامعتبر است' },
        { status: 400 }
      );
    }

    const suggestedItem = await dbQuery(() =>
      prisma.suggested_items.findUnique({
        where: { id },
        include: {
          lists: {
            include: {
              categories: true,
            },
          },
          users: true,
        },
      })
    );

    if (!suggestedItem) {
      return NextResponse.json(
        { success: false, error: 'پیشنهاد یافت نشد' },
        { status: 404 }
      );
    }

    // Allow editing regardless of status, but approve/reject only for pending
    if (action !== 'edit' && suggestedItem.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'این پیشنهاد قبلاً بررسی شده است' },
        { status: 400 }
      );
    }

    if (action === 'edit') {
      // Edit suggestion without changing status
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? await ensureImageInLiara(imageUrl, 'items') : null;
      if (externalUrl !== undefined) updateData.externalUrl = externalUrl;
      if (metadata !== undefined && suggestedItem.lists.categories) {
        // Validate metadata if provided
        const metadataValidation = validateMetadata(
          suggestedItem.lists.categories.slug,
          metadata
        );
        if (!metadataValidation.success) {
          return NextResponse.json(
            { success: false, error: metadataValidation.error },
            { status: 400 }
          );
        }
        updateData.metadata = metadataValidation.data || {};
      }

      await dbQuery(() =>
        prisma.suggested_items.update({
          where: { id },
          data: updateData,
        })
      );

      // Send notification if adminNotes provided
      if (adminNotes && adminNotes.trim()) {
        await createNotification(
          suggestedItem.userId,
          'suggestion_updated',
          'پیشنهاد آیتم شما ویرایش شد',
          adminNotes.trim(),
          undefined
        );
      }

      return NextResponse.json({
        success: true,
        message: 'پیشنهاد با موفقیت ویرایش شد',
      });
    } else if (action === 'approve') {
      // Validate metadata if provided
      let validatedMetadata = suggestedItem.metadata as any;
      if (metadata && suggestedItem.lists.categories) {
        const metadataValidation = validateMetadata(
          suggestedItem.lists.categories.slug,
          metadata
        );
        if (!metadataValidation.success) {
          return NextResponse.json(
            { success: false, error: metadataValidation.error },
            { status: 400 }
          );
        }
        validatedMetadata = metadataValidation.data || {};
      }

      const finalImageUrl = await ensureImageInLiara(
        imageUrl !== undefined ? imageUrl : suggestedItem.imageUrl,
        'items'
      );

      // Create actual item
      const newItem = await dbQuery(() =>
        prisma.items.create({
          data: {
            id: nanoid(),
            title: title || suggestedItem.title,
            description: description !== undefined ? description : suggestedItem.description,
            imageUrl: finalImageUrl,
            externalUrl: externalUrl !== undefined ? externalUrl : suggestedItem.externalUrl,
            listId: suggestedItem.listId,
            order: 0,
            metadata: validatedMetadata,
            commentsEnabled: true,
            maxComments: null,
            updatedAt: new Date(),
          },
        })
      );

      // Update list itemCount
      await dbQuery(() =>
        prisma.lists.update({
          where: { id: suggestedItem.listId },
          data: {
            itemCount: {
              increment: 1,
            },
          },
        })
      );

      // Update suggested item status
      await dbQuery(() =>
        prisma.suggested_items.update({
          where: { id },
          data: {
            status: 'approved',
            adminNotes: adminNotes || null,
          },
        })
      );

      // Create notification for user
      const notificationMessage = adminNotes?.trim() || 
        `با تشکر از پیشنهاد شما! آیتم "${newItem.title}" با موفقیت به لیست اضافه شد.`;
      
      await createNotification(
        suggestedItem.userId,
        'suggestion_approved',
        'پیشنهاد آیتم شما تایید شد',
        notificationMessage,
        `/lists/${suggestedItem.lists.slug}`
      );

      // Notify users who bookmarked this list
      notifyListBookmarkers(
        suggestedItem.listId,
        newItem.title,
        suggestedItem.lists.title || 'لیست'
      ).catch(console.error);

      return NextResponse.json({
        success: true,
        message: 'پیشنهاد با موفقیت تایید و آیتم ایجاد شد',
        data: newItem,
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
        prisma.suggested_items.update({
          where: { id },
          data: {
            status: 'rejected',
            adminNotes: adminNotes.trim(),
          },
        })
      );

      // Create notification for user
      await createNotification(
        suggestedItem.userId,
        'suggestion_rejected',
        'پیشنهاد آیتم شما رد شد',
        `متأسفانه پیشنهاد آیتم "${suggestedItem.title}" رد شد. دلیل: ${adminNotes.trim()}`,
        undefined
      );

      return NextResponse.json({
        success: true,
        message: 'پیشنهاد رد شد',
      });
    }
  } catch (error: any) {
    console.error('Error updating suggested item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در بروزرسانی پیشنهاد' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/suggestions/items/[id] - حذف پیشنهاد آیتم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const message = searchParams.get('message') || '';

    const suggestedItem = await dbQuery(() =>
      prisma.suggested_items.findUnique({
        where: { id },
        include: {
          users: true,
        },
      })
    );

    if (!suggestedItem) {
      return NextResponse.json(
        { success: false, error: 'پیشنهاد یافت نشد' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending suggestions
    if (suggestedItem.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'فقط پیشنهادات در انتظار بررسی قابل حذف هستند' },
        { status: 400 }
      );
    }

    // Send notification to user if message provided
    if (message && message.trim()) {
      await createNotification(
        suggestedItem.userId,
        'suggestion_deleted',
        'پیشنهاد آیتم شما حذف شد',
        message.trim(),
        undefined
      );
    }

    // Delete the suggestion
    await dbQuery(() =>
      prisma.suggested_items.delete({
        where: { id },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'پیشنهاد با موفقیت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting suggested item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در حذف پیشنهاد' },
      { status: 500 }
    );
  }
}

