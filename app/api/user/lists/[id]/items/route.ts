import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { nanoid } from 'nanoid';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { ensureImageInLiara } from '@/lib/object-storage';
import { resolveSessionUserId } from '@/lib/api-db';
import {
  addCatalogItemToList,
  backfillCatalogForItem,
  createCatalogItem,
  denormalizedItemFieldsFromCatalog,
  isCatalogInList,
} from '@/lib/catalog-items';

// POST /api/user/lists/[id]/items - افزودن آیتم به لیست شخصی
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'نشست نامعتبر است؛ لطفاً دوباره وارد شوید', code: 'SESSION_USER_NOT_FOUND' },
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
    if (list.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'شما اجازه افزودن آیتم به این لیست را ندارید' },
        { status: 403 }
      );
    }

    // لیست حذف‌شده نباید آیتم بپذیرد (هم‌راستا با مخفی‌بودنش در پروفایل/مودال)
    if (list.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'این لیست حذف شده است' },
        { status: 404 }
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
          include: {
            lists: { select: { categories: { select: { slug: true } } } },
          },
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
      const sourceCategorySlug = existingItem.lists?.categories?.slug ?? null;
      const baseMeta =
        existingItem.metadata != null &&
        typeof existingItem.metadata === 'object' &&
        !Array.isArray(existingItem.metadata)
          ? (existingItem.metadata as Record<string, unknown>)
          : {};
      itemMetadata = {
        ...baseMeta,
        // For personal lists (categoryId null) we still want to allow UI filtering by item type.
        sourceCategorySlug,
      };
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

    let sourceCatalogId: string | null = null;
    if (itemId) {
      const src = await dbQuery(() =>
        prisma.items.findUnique({
          where: { id: itemId },
          select: { catalogItemId: true },
        })
      );
      if (src?.catalogItemId) {
        sourceCatalogId = src.catalogItemId;
      } else if (itemId) {
        const catalog = await backfillCatalogForItem(prisma, itemId);
        sourceCatalogId = catalog?.id ?? null;
      }
    }

    if (sourceCatalogId) {
      const inList = await isCatalogInList(prisma, sourceCatalogId, listId);
      if (inList) {
        return NextResponse.json(
          {
            success: false,
            error: `«${itemTitle}» قبلاً در این لیست است`,
          },
          { status: 400 }
        );
      }
    } else {
      const duplicateItem = await dbQuery(() =>
        prisma.items.findFirst({
          where: {
            listId: listId,
            title: { equals: itemTitle, mode: 'insensitive' },
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

    const finalImageUrl = itemImageUrl ? await ensureImageInLiara(itemImageUrl, 'items') : null;
    const categorySlug =
      list.categories?.slug ??
      (typeof itemMetadata === 'object' &&
      itemMetadata &&
      !Array.isArray(itemMetadata) &&
      typeof (itemMetadata as Record<string, unknown>).sourceCategorySlug === 'string'
        ? ((itemMetadata as Record<string, unknown>).sourceCategorySlug as string)
        : null);

    let newItem;
    if (sourceCatalogId) {
      newItem = await dbQuery(() =>
        addCatalogItemToList(prisma, {
          catalogItemId: sourceCatalogId!,
          listId,
          order: newOrder,
        })
      );
    } else {
      const catalog = await dbQuery(() =>
        createCatalogItem(prisma, {
          title: itemTitle,
          description: itemDescription,
          imageUrl: finalImageUrl,
          externalUrl: itemExternalUrl,
          categorySlug,
          metadata: itemMetadata || {},
        })
      );
      const denorm = denormalizedItemFieldsFromCatalog(catalog);
      newItem = await dbQuery(() =>
        prisma.items.create({
          data: {
            id: nanoid(),
            ...denorm,
            listId,
            catalogItemId: catalog.id,
            order: newOrder,
            commentsEnabled: true,
            updatedAt: new Date(),
          },
          include: {
            lists: { include: { categories: true } },
          },
        })
      );
      await dbQuery(() =>
        prisma.lists.update({
          where: { id: listId },
          data: { itemCount: { increment: 1 } },
        })
      );
    }

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

