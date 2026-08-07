import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { nanoid } from 'nanoid';
import { notifyListBookmarkers } from '@/lib/utils/notifications';
import { ensureImageInLiara } from '@/lib/object-storage';
import {
  addCatalogItemToList,
  createCatalogItem,
  createLightweightListItem,
  denormalizedItemFieldsFromCatalog,
} from '@/lib/catalog-items';
import {
  isLightweightEntryKind,
  isMixedListCategory,
  parseEntryKind,
} from '@/lib/list-entry';
import { revalidateListDetailCache, revalidateCategoryCache } from '@/lib/public-cache';

// GET /api/admin/items - Get items (optionally filtered by listId)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');
    const idsParam = searchParams.get('ids');
    const q = searchParams.get('q')?.trim();

    const where: Prisma.itemsWhereInput = { deletedAt: null };
    if (idsParam) {
      const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) where.id = { in: ids };
    } else if (listId) {
      where.listId = listId;
    }
    if (q) {
      where.title = { contains: q, mode: 'insensitive' };
    }

    const items = await prisma.items.findMany({
      where,
      include: {
        lists: {
          include: {
            categories: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: error.status || 500 }
    );
  }
}

// POST /api/admin/items - Create new item
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      catalogItemId,
      title,
      description,
      imageUrl,
      externalUrl,
      listId,
      order = 0,
      metadata,
      commentsEnabled,
      maxComments,
      listNote,
    } = body;

    if (!listId) {
      return NextResponse.json({ error: 'لیست الزامی است' }, { status: 400 });
    }

    if (catalogItemId) {
      const item = await addCatalogItemToList(prisma, {
        catalogItemId,
        listId,
        order,
        listNote,
        commentsEnabled,
        maxComments,
      });
      const list = item.lists;
      if (list) {
        notifyListBookmarkers(listId, {
          itemCount: 1,
          categorySlug: list.categories?.slug,
          categoryName: list.categories?.name,
          listTitle: list.title,
        }).catch(console.error);
        revalidateListDetailCache(list.slug);
        revalidateCategoryCache(list.categoryId);
      }
      return NextResponse.json(item, { status: 201 });
    }

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان و لیست الزامی هستند' },
        { status: 400 }
      );
    }

    // Get list to determine category
    const list = await prisma.lists.findUnique({
      where: { id: listId },
      include: { categories: true },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Validate metadata based on category
    if (!list.categories) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }
    const metadataValidation = validateMetadata(
      list.categories.slug,
      metadata || {}
    );

    if (!metadataValidation.success) {
      return NextResponse.json(
        { error: metadataValidation.error },
        { status: 400 }
      );
    }

    const meta = metadataValidation.data || {};
    const metaRecord = meta as Record<string, unknown>;
    const entryKind =
      parseEntryKind((metadata as Record<string, unknown> | undefined)?.entryKind) ??
      parseEntryKind(metaRecord.entryKind) ??
      'catalog_ref';

    if (
      isMixedListCategory(list.categories.slug) &&
      isLightweightEntryKind(entryKind)
    ) {
      const item = await createLightweightListItem(prisma, {
        title,
        description,
        imageUrl: imageUrl ? await ensureImageInLiara(imageUrl, 'items') : null,
        externalUrl,
        listId,
        order,
        listNote,
        commentsEnabled,
        maxComments,
        metadata: metaRecord as Prisma.InputJsonValue,
        entryKind,
      });

      notifyListBookmarkers(listId, {
        itemCount: 1,
        categorySlug: list.categories?.slug,
        categoryName: list.categories?.name,
        listTitle: list.title,
      }).catch(console.error);
      revalidateListDetailCache(list.slug);
      revalidateCategoryCache(list.categoryId);
      return NextResponse.json(item, { status: 201 });
    }

    const finalImageUrl = imageUrl ? await ensureImageInLiara(imageUrl, 'items') : null;

    const catalog = await createCatalogItem(prisma, {
      title,
      description,
      imageUrl: finalImageUrl,
      externalUrl,
      categorySlug: list.categories.slug,
      metadata: {
        ...meta,
        entryKind: 'catalog_ref',
        sourceCategorySlug: list.categories.slug,
      },
    });

    const denorm = denormalizedItemFieldsFromCatalog(catalog);

    const item = await prisma.items.create({
      data: {
        id: nanoid(),
        ...denorm,
        metadata: {
          ...(typeof denorm.metadata === 'object' && denorm.metadata && !Array.isArray(denorm.metadata)
            ? denorm.metadata
            : {}),
          entryKind: 'catalog_ref',
          sourceCategorySlug: catalog.categorySlug ?? list.categories.slug,
        },
        listId,
        catalogItemId: catalog.id,
        listNote: listNote?.trim() || null,
        order,
        commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : true,
        maxComments: maxComments !== undefined ? maxComments : null,
        updatedAt: new Date(),
      },
      include: {
        lists: { include: { categories: true } },
        catalog_items: true,
      },
    });

    // Update list itemCount
    await prisma.lists.update({
      where: { id: listId },
      data: {
        itemCount: {
          increment: 1,
        },
      },
    });

    // Notify users who bookmarked this list
    notifyListBookmarkers(listId, {
      itemCount: 1,
      categorySlug: list.categories?.slug,
      categoryName: list.categories?.name,
      listTitle: list.title,
    }).catch(console.error);

    revalidateListDetailCache(list.slug);
    revalidateCategoryCache(list.categoryId);

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create item' },
      { status: error.status || 500 }
    );
  }
}
