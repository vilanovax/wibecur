import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { requireAdminUser } from '@/lib/auth/require-permission';
import { softDeleteItems } from '@/lib/admin/item-trash';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { notifyListBookmarkers } from '@/lib/utils/notifications';
import { ensureImageInLiara } from '@/lib/object-storage';
import {
  backfillCatalogForItem,
  buildCatalogExternalKey,
  isCatalogInList,
  syncPlacementsFromCatalog,
} from '@/lib/catalog-items';
import {
  isLightweightEntryKind,
  isMixedListCategory,
  parseEntryKind,
} from '@/lib/list-entry';

// GET /api/admin/items/[id] - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const item = await prisma.items.findUnique({
      where: { id },
      include: {
        lists: {
          include: {
            categories: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch item' },
      { status: error.status || 500 }
    );
  }
}

// PUT /api/admin/items/[id] - Update item
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
      imageUrl,
      externalUrl,
      order,
      metadata,
      commentsEnabled,
      maxComments,
      listId,
      listNote,
    } = body;

    // Check if item exists
    const existingItem = await prisma.items.findUnique({
      where: { id },
      include: {
        lists: {
          include: {
            categories: true,
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    const previousListId = existingItem.listId;

    // Validate metadata based on category
    if (!existingItem.lists.categories) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }
    const metadataValidation = validateMetadata(
      existingItem.lists.categories.slug,
      metadata || {}
    );

    if (!metadataValidation.success) {
      return NextResponse.json(
        { error: metadataValidation.error },
        { status: 400 }
      );
    }

    const finalImageUrl = imageUrl !== undefined ? await ensureImageInLiara(imageUrl, 'items') : undefined;
    const meta = metadataValidation.data || {};
    const metaRecord = meta as Record<string, unknown>;
    const categorySlug = existingItem.lists.categories.slug;
    const targetListId = listId !== undefined ? listId : existingItem.listId;

    const entryKind =
      parseEntryKind((metadata as Record<string, unknown> | undefined)?.entryKind) ??
      parseEntryKind(metaRecord.entryKind) ??
      (existingItem.catalogItemId ? 'catalog_ref' : 'tip');

    const isLightweightPlacement =
      !existingItem.catalogItemId &&
      isMixedListCategory(categorySlug) &&
      isLightweightEntryKind(entryKind);

    if (isLightweightPlacement) {
      metaRecord.entryKind = entryKind;
    }

    let catalogItemId = existingItem.catalogItemId;
    if (!catalogItemId && !isLightweightPlacement) {
      const catalog = await backfillCatalogForItem(prisma, id);
      catalogItemId = catalog?.id ?? null;
    }

    if (
      catalogItemId &&
      targetListId !== existingItem.listId &&
      (await isCatalogInList(prisma, catalogItemId, targetListId))
    ) {
      return NextResponse.json(
        { error: 'این آیتم کاتالوگ در لیست مقصد از قبل وجود دارد' },
        { status: 409 }
      );
    }

    if (catalogItemId && !isLightweightPlacement) {
      await prisma.catalog_items.update({
        where: { id: catalogItemId },
        data: {
          title: title ?? existingItem.title,
          description: description !== undefined ? description : existingItem.description,
          ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
          externalUrl: externalUrl !== undefined ? externalUrl : existingItem.externalUrl,
          categorySlug,
          metadata: metaRecord as Prisma.InputJsonValue,
          externalKey: buildCatalogExternalKey(categorySlug, title ?? existingItem.title, metaRecord),
          updatedAt: new Date(),
        },
      });
      await syncPlacementsFromCatalog(prisma, catalogItemId);
    }

    const item = await prisma.items.update({
      where: { id },
      data: {
        ...(isLightweightPlacement || !catalogItemId
          ? {
              title,
              description,
              ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl }),
              externalUrl,
              metadata: metaRecord as Prisma.InputJsonValue,
            }
          : {}),
        ...(listNote !== undefined && { listNote: listNote?.trim() || null }),
        order,
        commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : true,
        maxComments: maxComments !== undefined ? maxComments : null,
        listId: targetListId,
        updatedAt: new Date(),
      },
      include: {
        lists: { include: { categories: true } },
        catalog_items: true,
      },
    });

    // If listId changed, notify users who bookmarked the new list
    if (listId && listId !== previousListId) {
      const newList = await prisma.lists.findUnique({
        where: { id: listId },
        select: { title: true },
      });

      if (newList) {
        notifyListBookmarkers(listId, {
          itemCount: 1,
          listTitle: newList.title || 'لیست',
        }).catch(console.error);
      }
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: error.status || 500 }
    );
  }
}

// PATCH /api/admin/items/[id] - فقط به‌روزرسانی order (برای جابه‌جایی در لیست)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { order } = body;

    const existing = await prisma.items.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    if (typeof order !== 'number') {
      return NextResponse.json({ error: 'order الزامی است' }, { status: 400 });
    }

    const item = await prisma.items.update({
      where: { id },
      data: { order },
    });
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error PATCH item:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در به‌روزرسانی' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/items/[id] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAdminUser();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;

    // Check if item exists
    const existingItem = await prisma.items.findUnique({
      where: { id },
      select: { id: true, listId: true, deletedAt: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }
    if (existingItem.deletedAt) {
      return NextResponse.json({ error: 'این آیتم در زباله‌دان است' }, { status: 400 });
    }

    const processed = await softDeleteItems(prisma, [id], userOrRes.id);
    if (processed === 0) {
      return NextResponse.json({ error: 'حذف انجام نشد' }, { status: 400 });
    }

    return NextResponse.json({ message: 'آیتم به زباله‌دان منتقل شد' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: error.status || 500 }
    );
  }
}
