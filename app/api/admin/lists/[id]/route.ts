import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      title,
      slug,
      description,
      coverImage,
      categoryId,
      badge,
      isPublic,
      isFeatured,
      isActive,
    } = body;

    // Validate required fields
    if (!title || !slug || !categoryId) {
      return NextResponse.json(
        { error: 'عنوان، slug و دسته‌بندی الزامی هستند' },
        { status: 400 }
      );
    }

    // Check if list exists
    const existingList = await prisma.lists.findUnique({
      where: { id: params.id },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Check if slug is taken by another list
    if (slug !== existingList.slug) {
      const slugExists = await prisma.lists.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'این slug قبلاً استفاده شده است' },
          { status: 400 }
        );
      }
    }

    // Update list
    const list = await prisma.lists.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        description,
        coverImage,
        categoryId,
        badge: badge || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error updating list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ویرایش لیست' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    // Check if list exists
    const existingList = await prisma.lists.findUnique({
      where: { id: params.id },
    });

    if (!existingList) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Delete list (items will be deleted automatically due to cascade)
    await prisma.lists.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در حذف لیست' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const list = await prisma.lists.findUnique({
      where: { id: params.id },
      include: {
        categories: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { items: true, list_likes: true, bookmarks: true },
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست' },
      { status: 500 }
    );
  }
}
