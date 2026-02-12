import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { notifyListBookmarkers } from '@/lib/utils/notifications';
import { uploadImageFromUrl } from '@/lib/object-storage';

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

    // Upload to Object Storage if imageUrl is external (not already in our storage)
    let finalImageUrl = imageUrl;
    if (imageUrl && imageUrl !== existingItem.imageUrl) {
      const { isOurStorageUrl } = await import('@/lib/object-storage-config');
      if (imageUrl.startsWith('http') && !isOurStorageUrl(imageUrl)) {
        console.log('Uploading external image to Object Storage:', imageUrl);
        const uploadedUrl = await uploadImageFromUrl(imageUrl, 'items');
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          console.log('Image uploaded to Object Storage:', uploadedUrl);
        } else {
          console.warn('Failed to upload to Liara, using original URL');
        }
      }
    }

    // Update item
    const item = await prisma.items.update({
      where: { id },
      data: {
        title,
        description,
        imageUrl: finalImageUrl,
        externalUrl,
        order,
        metadata: metadataValidation.data || {},
        commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : true,
        maxComments: maxComments !== undefined ? maxComments : null,
        listId: listId !== undefined ? listId : existingItem.listId,
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

    // If listId changed, notify users who bookmarked the new list
    if (listId && listId !== previousListId) {
      const newList = await prisma.lists.findUnique({
        where: { id: listId },
        select: { title: true },
      });

      if (newList) {
        notifyListBookmarkers(
          listId,
          item.title,
          newList.title || 'لیست'
        ).catch(console.error);
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

// DELETE /api/admin/items/[id] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if item exists
    const existingItem = await prisma.items.findUnique({
      where: { id },
      select: { id: true, listId: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'آیتم یافت نشد' }, { status: 404 });
    }

    // Delete item
    await prisma.items.delete({
      where: { id },
    });

    // Update list itemCount
    await prisma.lists.update({
      where: { id: existingItem.listId },
      data: {
        itemCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({ message: 'آیتم با موفقیت حذف شد' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: error.status || 500 }
    );
  }
}
