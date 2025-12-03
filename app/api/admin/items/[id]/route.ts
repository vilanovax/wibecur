import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { validateMetadata } from '@/lib/schemas/item-metadata';

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

    // Validate metadata based on category
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

    // Update item
    const item = await prisma.items.update({
      where: { id },
      data: {
        title,
        description,
        imageUrl,
        externalUrl,
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
