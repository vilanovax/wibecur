import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { nanoid } from 'nanoid';
import { ensureImageInLiara } from '@/lib/object-storage';
import { revalidateAdminListsAndCategoriesCache } from '@/lib/admin/admin-cache';

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

    const finalCoverImage = coverImage ? await ensureImageInLiara(coverImage, 'lists', { profile: 'coverList' }) : null;
    const finalHorizontalImage = horizontalImage
      ? await ensureImageInLiara(horizontalImage, 'lists', { profile: 'coverListHorizontal' })
      : null;

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
        updatedAt: new Date(),
      },
    });

    revalidateAdminListsAndCategoriesCache();
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
    const adminUser = await requirePermission('manage_lists');
    if (adminUser instanceof NextResponse) return adminUser;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const trash = searchParams.get('trash') === 'true';

    const lists = await prisma.lists.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(includeInactive ? {} : { isActive: true }),
        deletedAt: trash ? { not: null } : null,
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
