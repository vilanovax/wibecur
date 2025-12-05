import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';
import { validateMetadata } from '@/lib/schemas/item-metadata';

// POST /api/user/lists/[id]/items - افزودن آیتم به لیست شخصی
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const { id: listId } = await params;
    const body = await request.json();
    const {
      itemId, // ID آیتم موجود (برای کپی کردن)
      title, // یا می‌تواند آیتم جدید باشد
      description,
      imageUrl,
      externalUrl,
      metadata,
      order,
    } = body;

    // Get user
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: session.user.email! },
      })
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if list exists and belongs to user
    const list = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id: listId },
        include: {
          categories: true,
        },
      })
    );

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Check ownership
    if (list.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'شما اجازه افزودن آیتم به این لیست را ندارید' },
        { status: 403 }
      );
    }

    let itemTitle: string;
    let itemDescription: string | null = null;
    let itemImageUrl: string | null = null;
    let itemExternalUrl: string | null = null;
    let itemMetadata: any = {};

    // If itemId is provided, copy from existing item
    if (itemId) {
      const existingItem = await dbQuery(() =>
        prisma.items.findUnique({
          where: { id: itemId },
        })
      );

      if (!existingItem) {
        return NextResponse.json(
          { success: false, error: 'آیتم یافت نشد' },
          { status: 404 }
        );
      }

      itemTitle = existingItem.title;
      itemDescription = existingItem.description;
      itemImageUrl = existingItem.imageUrl;
      itemExternalUrl = existingItem.externalUrl;
      itemMetadata = existingItem.metadata || {};
    } else if (title) {
      // Create new item from provided data
      itemTitle = title.trim();
      itemDescription = description?.trim() || null;
      itemImageUrl = imageUrl?.trim() || null;
      itemExternalUrl = externalUrl?.trim() || null;
      itemMetadata = metadata || {};
    } else {
      return NextResponse.json(
        { success: false, error: 'عنوان یا شناسه آیتم الزامی است' },
        { status: 400 }
      );
    }

    // Check if item with same title already exists in this list
    const duplicateItem = await dbQuery(() =>
      prisma.items.findFirst({
        where: {
          listId: listId,
          title: {
            equals: itemTitle,
            mode: 'insensitive', // Case-insensitive comparison
          },
        },
      })
    );

    if (duplicateItem) {
      return NextResponse.json(
        {
          success: false,
          error: `آیتم با عنوان "${itemTitle}" قبلاً در این لیست وجود دارد`,
        },
        { status: 400 }
      );
    }

    // Validate metadata based on category (only if category exists)
    // For personal lists without category, skip metadata validation
    if (list.categories && list.categories.slug) {
      const metadataValidation = validateMetadata(
        list.categories.slug,
        itemMetadata || {}
      );

      if (!metadataValidation.success) {
        return NextResponse.json(
          { success: false, error: metadataValidation.error },
          { status: 400 }
        );
      }
      itemMetadata = metadataValidation.data || {};
    }

    // Get current max order in the list
    const maxOrderItem = await dbQuery(() =>
      prisma.items.findFirst({
        where: { listId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
    );

    const newOrder = order !== undefined ? order : (maxOrderItem?.order ?? -1) + 1;

    // Create item
    const newItem = await dbQuery(() =>
      prisma.items.create({
        data: {
          id: nanoid(),
          title: itemTitle,
          description: itemDescription,
          imageUrl: itemImageUrl,
          externalUrl: itemExternalUrl,
          listId: listId,
          order: newOrder,
          metadata: itemMetadata || {},
          commentsEnabled: true,
          updatedAt: new Date(),
        },
        include: {
          lists: {
            include: {
              categories: true,
            },
          },
        },
      })
    );

    // Update list itemCount
    await dbQuery(() =>
      prisma.lists.update({
        where: { id: listId },
        data: {
          itemCount: {
            increment: 1,
          },
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'آیتم با موفقیت به لیست اضافه شد',
    });
  } catch (error: any) {
    console.error('Error adding item to user list:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در افزودن آیتم' },
      { status: 500 }
    );
  }
}

