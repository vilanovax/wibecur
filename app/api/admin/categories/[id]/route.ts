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
    const { name, slug, icon, color, description, order, isActive } = body;

    // Validate required fields
    if (!name || !slug || !icon) {
      return NextResponse.json(
        { error: 'نام، slug و آیکون الزامی هستند' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id: params.id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    // Check if slug is taken by another category
    if (slug !== existingCategory.slug) {
      const slugExists = await prisma.categories.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'این slug قبلاً استفاده شده است' },
          { status: 400 }
        );
      }
    }

    // Update category
    const category = await prisma.categories.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        icon,
        color: color || '#6366F1',
        description,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ویرایش دسته‌بندی' },
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

    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { lists: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    // Check if category has lists
    if (existingCategory._count.lists > 0) {
      return NextResponse.json(
        {
          error: `این دسته‌بندی ${existingCategory._count.lists} لیست دارد و قابل حذف نیست`,
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.categories.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در حذف دسته‌بندی' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.categories.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { lists: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی' },
      { status: 500 }
    );
  }
}
