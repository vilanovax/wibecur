import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    // Check if slug already exists
    const existingCategory = await prisma.categories.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'این slug قبلاً استفاده شده است' },
        { status: 400 }
      );
    }

    // Create category
    const category = await prisma.categories.create({
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

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ایجاد دسته‌بندی' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const categories = await prisma.categories.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { lists: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دسته‌بندی‌ها' },
      { status: 500 }
    );
  }
}
