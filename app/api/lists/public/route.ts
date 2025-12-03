import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// GET /api/lists/public - دریافت لیست‌های عمومی و فعال
export async function GET(request: NextRequest) {
  try {
    const lists = await dbQuery(() =>
      prisma.lists.findMany({
        where: {
          isActive: true,
          isPublic: true,
        },
        select: {
          id: true,
          title: true,
          categories: {
            select: {
              name: true,
              icon: true,
            },
          },
        },
        orderBy: {
          title: 'asc',
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: lists,
    });
  } catch (error: any) {
    console.error('Error fetching public lists:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}

