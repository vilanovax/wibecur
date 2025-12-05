import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { slugify } from '@/lib/utils/slug';
import { nanoid } from 'nanoid';

// POST /api/user/lists - ایجاد لیست شخصی
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user/lists - Request received');
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'exists' : 'missing', session?.user?.email);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'خطا در پردازش داده‌های ارسالی' },
        { status: 400 }
      );
    }

    const { title, description, coverImage, commentsEnabled } = body;
    console.log('Extracted fields:', { title, hasDescription: !!description, hasCoverImage: !!coverImage });

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'عنوان الزامی است' },
        { status: 400 }
      );
    }

    // Get user
    console.log('Fetching user with email:', session.user.email);
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: session.user.email! },
      })
    );
    console.log('User found:', user ? `ID: ${user.id}` : 'not found');

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Get settings for maxPersonalLists
    const settings = await dbQuery(() =>
      prisma.settings.findUnique({
        where: { id: 'settings' },
      })
    );
    const maxPersonalLists = settings?.maxPersonalLists || 3;

    // Check how many private lists (isPublic: false) the user has
    const privateListsCount = await dbQuery(() =>
      prisma.lists.count({
        where: {
          userId: user.id,
          isPublic: false,
        },
      })
    );

    if (privateListsCount >= maxPersonalLists) {
      return NextResponse.json(
        { error: `شما نمی‌توانید بیشتر از ${maxPersonalLists} لیست خصوصی ایجاد کنید. لطفاً یکی از لیست‌های قبلی را حذف کنید یا آن را عمومی کنید.` },
        { status: 400 }
      );
    }

    // No bad words check for private lists (will be checked when making public)

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug || baseSlug.trim() === '') {
      // Fallback for Persian/other languages
      baseSlug = `list-${Date.now()}`;
    }

    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;
    const maxAttempts = 100;

    while (!isUnique && counter < maxAttempts) {
      const existing = await dbQuery(() =>
        prisma.lists.findUnique({
          where: { slug },
        })
      );

      if (!existing) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'خطا در ایجاد slug یکتا' },
        { status: 500 }
      );
    }

    const minItems = settings?.minItemsForPublicList || 5;

    // Create list (isPublic defaults to false for user-created lists, categoryId is null)
    // Note: updatedAt is managed by Prisma @updatedAt directive
    console.log('Creating list with data:', {
      title: title.trim(),
      slug,
      categoryId: null,
      userId: user.id,
      hasDescription: !!description,
      hasCoverImage: !!coverImage,
      isPublic: false,
      isActive: true, // Private lists are always active
      commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : true,
    });
    
    let list;
    try {
      list = await dbQuery(() =>
        prisma.lists.create({
          data: {
            id: nanoid(),
            title: title.trim(),
            slug,
            description: description ? description.trim() : null,
            coverImage: coverImage ? coverImage.trim() : null,
            categoryId: null, // Personal lists don't have categories
            userId: user.id,
            isPublic: false, // User lists start as private
            isActive: true, // Private lists are always active
            commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : true,
          },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        })
      );
      console.log('List created successfully:', list.id);
    } catch (createError: any) {
      console.error('Error in prisma.lists.create:', createError);
      console.error('Create error details:', {
        message: createError.message,
        code: createError.code,
        meta: createError.meta,
      });
      throw createError;
    }

    return NextResponse.json(
      {
        success: true,
        data: list,
        message: `لیست ایجاد شد. برای عمومی شدن لیست، باید حداقل ${minItems} آیتم داشته باشد.`,
        minItemsForPublicList: minItems,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user list:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      name: error.name,
    });
    
    // More specific error messages
    let errorMessage = 'خطا در ایجاد لیست';
    if (error.code === 'P2002') {
      errorMessage = 'این slug قبلاً استفاده شده است';
    } else if (error.code === 'P2003') {
      errorMessage = 'دسته‌بندی یا کاربر معتبر نیست';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          meta: error.meta,
          name: error.name,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

// GET /api/user/lists - دریافت لیست‌های کاربر
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: session.user.email! },
      })
    );

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    const lists = await dbQuery(() =>
      prisma.lists.findMany({
        where: {
          userId: user.id,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
          _count: {
            select: {
              items: true,
              list_likes: true,
              bookmarks: true,
            },
          },
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: lists,
    });
  } catch (error: any) {
    console.error('Error fetching user lists:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت لیست‌ها' },
      { status: 500 }
    );
  }
}

