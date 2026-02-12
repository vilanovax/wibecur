import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { nanoid } from 'nanoid';
import { notifyListBookmarkers } from '@/lib/utils/notifications';
import { ensureImageInLiara } from '@/lib/object-storage';

// GET /api/admin/items - Get items (optionally filtered by listId)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');

    const where = listId ? { listId } : {};

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
      title,
      description,
      imageUrl,
      externalUrl,
      listId,
      order = 0,
      metadata,
      commentsEnabled,
      maxComments,
    } = body;

    // Validation
    if (!title || !listId) {
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

    const finalImageUrl = imageUrl ? await ensureImageInLiara(imageUrl, 'items') : null;

    // Create item
    const item = await prisma.items.create({
      data: {
        id: nanoid(),
        title,
        description,
        imageUrl: finalImageUrl,
        externalUrl,
        listId,
        order,
        metadata: metadataValidation.data || {},
        commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : true,
        maxComments: maxComments !== undefined ? maxComments : null,
        updatedAt: new Date(),
      },
      include: {
        lists: {
          include: {
            categories: true,
          },
        },
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
    notifyListBookmarkers(listId, item.title, list.title).catch(console.error);

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create item' },
      { status: error.status || 500 }
    );
  }
}
