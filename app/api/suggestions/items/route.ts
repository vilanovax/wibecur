import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { checkDuplicateSuggestion } from '@/lib/suggestion-utils';
import { ensureImageInLiara } from '@/lib/object-storage';

// POST /api/suggestions/items - ثبت پیشنهاد آیتم
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { title, description, imageUrl, externalUrl, listId, metadata } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'عنوان الزامی است' },
        { status: 400 }
      );
    }

    if (!listId) {
      return NextResponse.json(
        { success: false, error: 'انتخاب لیست الزامی است' },
        { status: 400 }
      );
    }

    // Check if list exists and is active
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        include: { categories: true },
      })
    );

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    if (!list.isActive) {
      return NextResponse.json(
        { success: false, error: 'این لیست غیرفعال است' },
        { status: 400 }
      );
    }

    const dup = await checkDuplicateSuggestion(listId, title.trim());
    if (dup.exists) {
      return NextResponse.json({
        success: false,
        alreadySuggested: true,
        suggestionCommentId: dup.suggestionCommentId,
        error: 'این مورد قبلاً پیشنهاد شده 👌',
      });
    }

    const finalImageUrl = imageUrl ? await ensureImageInLiara(imageUrl.trim(), 'items') : null;

    // Create suggested item
    const suggestedItem = await dbQuery(() =>
      prisma.suggested_items.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          imageUrl: finalImageUrl,
          externalUrl: externalUrl?.trim() || null,
          listId,
          userId,
          metadata: metadata || {},
          status: 'pending',
        },
        include: {
          lists: {
            include: {
              categories: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: suggestedItem,
        message: 'پیشنهاد شما با موفقیت ثبت شد و پس از بررسی ادمین اضافه خواهد شد',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating suggested item:', error);
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در ثبت پیشنهاد') },
      { status: 500 }
    );
  }
}

