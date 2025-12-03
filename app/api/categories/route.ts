import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/categories - دریافت دسته‌بندی‌های فعال
export async function GET(request: NextRequest) {
  try {
    const categories = await dbQuery(() =>
      prisma.categories.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          color: true,
        },
        orderBy: {
          order: 'asc',
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت دسته‌بندی‌ها' },
      { status: 500 }
    );
  }
}

