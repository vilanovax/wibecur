import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { nanoid } from 'nanoid';
import { ensureImageInLiara } from '@/lib/object-storage';
import { revalidateAdminListsAndCategoriesCache } from '@/lib/admin/admin-cache';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('manage_lists');
    if (adminUser instanceof NextResponse) return adminUser;

    const body = await request.json();
    const {
      title,
      slug,
      description,
      coverImage,
      horizontalImage,
      categoryId,
      badge,
      isPublic,
      isFeatured,
      isActive,
      commentsEnabled,
      itemDetailEnabled,
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

    const user = await prisma.users.findUnique({
      where: { id: adminUser.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'حساب کاربری یافت نشد — لطفاً دوباره وارد شوید', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    const coverInput = typeof coverImage === 'string' ? coverImage.trim() : '';
    const horizontalInput =
      typeof horizontalImage === 'string' ? horizontalImage.trim() : '';

    const finalCoverImage = coverInput
      ? await ensureImageInLiara(coverInput, 'lists', { profile: 'coverList' })
      : null;
    const finalHorizontalImage = horizontalInput
      ? await ensureImageInLiara(horizontalInput, 'lists', {
          profile: 'coverListHorizontal',
        })
      : null;

    // قبلاً آپلود موفق می‌شد ولی ensure شکست می‌خورد و کاور بی‌صدا null می‌شد
    if (coverInput && !finalCoverImage) {
      return NextResponse.json(
        {
          error:
            'کاور آپلود شد ولی ذخیره نشد. دوباره آپلود کنید یا چند لحظه بعد تلاش کنید.',
          code: 'COVER_PERSIST_FAILED',
        },
        { status: 422 }
      );
    }
    if (horizontalInput && !finalHorizontalImage) {
      return NextResponse.json(
        {
          error:
            'بنر افقی آپلود شد ولی ذخیره نشد. دوباره آپلود کنید یا چند لحظه بعد تلاش کنید.',
          code: 'BANNER_PERSIST_FAILED',
        },
        { status: 422 }
      );
    }

    // Create list
    const list = await prisma.lists.create({
      data: {
        id: nanoid(),
        title,
        slug,
        description,
        coverImage: finalCoverImage,
        horizontalImage: finalHorizontalImage,
        categoryId,
        userId: user.id,
        badge: badge || null,
        isPublic: isPublic !== undefined ? isPublic : true,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        isActive: isActive !== undefined ? isActive : true,
        commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : true,
        itemDetailEnabled: itemDetailEnabled !== undefined ? itemDetailEnabled : true,
        updatedAt: new Date(),
      },
    });

    revalidateAdminListsAndCategoriesCache();
    return NextResponse.json(list, { status: 201 });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    console.error('Error creating list:', error);
    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'این slug قبلاً استفاده شده است' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'خطا در ایجاد لیست' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePermission('manage_lists');
    if (adminUser instanceof NextResponse) return adminUser;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const trash = searchParams.get('trash') === 'true';
    const q = (searchParams.get('q') ?? '').trim();

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const rawSize = parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number.isFinite(rawSize) ? rawSize : DEFAULT_PAGE_SIZE)
    );

    const where: Prisma.listsWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
      deletedAt: trash ? { not: null } : null,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.lists.count({ where }),
      prisma.lists.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error: unknown) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}
