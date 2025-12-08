import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { requireAdmin } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

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

    // Check if slug already exists
    const existingList = await prisma.lists.findUnique({
      where: { slug },
    });

    if (existingList) {
      return NextResponse.json(
        { error: 'این slug قبلاً استفاده شده است' },
        { status: 400 }
      );
    }

    // Get user ID from email
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Create list
    const list = await prisma.lists.create({
      data: {
        id: nanoid(),
        title,
        slug,
        description,
        coverImage,
        categoryId,
        userId: user.id,
        badge: badge || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error: any) {
    console.error('Error creating list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ایجاد لیست' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const lists = await prisma.lists.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { items: true, list_likes: true, bookmarks: true },
        },
      },
    });

    return NextResponse.json(lists);
  } catch (error: any) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}
