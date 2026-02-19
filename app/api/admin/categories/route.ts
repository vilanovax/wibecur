import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { nanoid } from 'nanoid';

const ALLOWED_WEIGHTS = [0.8, 1.0, 1.2, 1.4] as const;
function normalizeTrendingWeight(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  const found = ALLOWED_WEIGHTS.find((w) => Math.abs(w - n) < 0.01);
  return found ?? 1;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, slug, icon, color, description, order, isActive, trendingWeight } = body;

    // Validate required fields
    if (!name || !slug || !icon) {
      return NextResponse.json(
        { error: 'نام، slug و آیکون الزامی هستند' },
        { status: 400 }
      );
    }

    const weight = normalizeTrendingWeight(trendingWeight);

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
        id: nanoid(),
        name,
        slug,
        icon,
        color: color || '#6366F1',
        description,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        trendingWeight: weight,
        updatedAt: new Date(),
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
    const trash = searchParams.get('trash') === 'true';

    const baseWhere = includeInactive ? {} : { isActive: true };
    const categories = await prisma.categories.findMany({
      where: {
        ...baseWhere,
        deletedAt: trash ? { not: null } : null,
      },
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
