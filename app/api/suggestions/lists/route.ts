import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

// POST /api/suggestions/lists - ثبت پیشنهاد لیست
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { title, description, coverImage, categoryId } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'عنوان الزامی است' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'انتخاب دسته‌بندی الزامی است' },
        { status: 400 }
      );
    }

    // Check if category exists and is active
    const category = await dbQuery(() =>
      prisma.categories.findUnique({
        where: { id: categoryId },
      })
    );

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'دسته‌بندی یافت نشد' },
        { status: 404 }
      );
    }

    if (!category.isActive) {
      return NextResponse.json(
        { success: false, error: 'این دسته‌بندی غیرفعال است' },
        { status: 400 }
      );
    }

    // Create suggested list
    const suggestedList = await dbQuery(() =>
      prisma.suggested_lists.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          coverImage: coverImage?.trim() || null,
          categoryId,
          userId,
          status: 'pending',
        },
        include: {
          categories: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: suggestedList,
        message: 'پیشنهاد شما با موفقیت ثبت شد و پس از بررسی ادمین اضافه خواهد شد',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating suggested list:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در ثبت پیشنهاد' },
      { status: 500 }
    );
  }
}

