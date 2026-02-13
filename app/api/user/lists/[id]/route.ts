import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { slugify } from '@/lib/utils/slug';
import { ensureImageInLiara } from '@/lib/object-storage';
import { checkAchievements } from '@/lib/achievements';

// PUT /api/user/lists/[id] - ویرایش لیست شخصی
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, coverImage, categoryId, isPublic, commentsEnabled } = body;

    // Get user (session.user is guaranteed to exist after the check above)
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: userEmail },
      })
    );

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if list exists and belongs to user
    const existingList = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              role: true,
            },
          },
        },
      })
    );

    if (!existingList) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    // Only allow editing if user is the owner OR if user is admin (but admin should use admin routes)
    if (existingList.userId !== user.id) {
      return NextResponse.json(
        { error: 'شما اجازه ویرایش این لیست را ندارید' },
        { status: 403 }
      );
    }

    // Check if user is trying to make it public
    let newIsPublic = existingList.isPublic;
    let hasBadWord = false;
    
    if (isPublic !== undefined && isPublic !== existingList.isPublic) {
      // Check minimum items requirement
      const settings = await dbQuery(() =>
        prisma.settings.findUnique({
          where: { id: 'settings' },
        })
      );
      const minItems = settings?.minItemsForPublicList || 5;

      if (isPublic && existingList.itemCount < minItems) {
        return NextResponse.json(
          {
            error: `برای عمومی شدن لیست، باید حداقل ${minItems} آیتم داشته باشد.`,
            minItemsForPublicList: minItems,
          },
          { status: 400 }
        );
      }

      // If making public, check for bad words in title and description
      if (isPublic) {
        try {
          const badWords = await dbQuery(() =>
            prisma.bad_words.findMany({
              select: { word: true },
            })
          );
          const badWordsList = badWords.map((bw) => bw.word.toLowerCase());
          const titleLower = (title || existingList.title).toLowerCase();
          const descLower = ((description !== undefined ? description : existingList.description) || '').toLowerCase();
          
          hasBadWord = badWordsList.some((word) => 
            titleLower.includes(word) || descLower.includes(word)
          );
          
          if (hasBadWord) {
            return NextResponse.json(
              {
                error: 'لیست شامل کلمات نامناسب است و نمی‌تواند عمومی شود.',
              },
              { status: 400 }
            );
          }
        } catch (err) {
          console.warn('Could not check bad words:', err);
        }
      }

      newIsPublic = isPublic;
    } else if (title && title !== existingList.title && existingList.isPublic) {
      // If list is already public and title is being updated, check for bad words
      try {
        const badWords = await dbQuery(() =>
          prisma.bad_words.findMany({
            select: { word: true },
          })
        );
        const badWordsList = badWords.map((bw) => bw.word.toLowerCase());
        const titleLower = title.toLowerCase();
        hasBadWord = badWordsList.some((word) => titleLower.includes(word));
        
        if (hasBadWord) {
          return NextResponse.json(
            {
              error: 'عنوان شامل کلمات نامناسب است.',
            },
            { status: 400 }
          );
        }
      } catch (err) {
        console.warn('Could not check bad words:', err);
      }
    }

    // Generate new slug if title changed
    let slug = existingList.slug;
    if (title && title !== existingList.title) {
      let baseSlug = slugify(title);
      if (!baseSlug || baseSlug.trim() === '') {
        baseSlug = `list-${Date.now()}`;
      }

      let newSlug = baseSlug;
      let counter = 1;
      let isUnique = false;
      const maxAttempts = 100;

      while (!isUnique && counter < maxAttempts) {
        const existing = await dbQuery(() =>
          prisma.lists.findUnique({
            where: { slug: newSlug },
          })
        );

        if (!existing || existing.id === id) {
          isUnique = true;
          slug = newSlug;
        } else {
          newSlug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
    }

    // Update list (don't update categoryId for personal lists)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage ? await ensureImageInLiara(coverImage.trim(), 'covers') : null;
    }
    // Don't allow changing categoryId for personal lists (they should remain null)
    if (commentsEnabled !== undefined) updateData.commentsEnabled = commentsEnabled;
    updateData.isPublic = newIsPublic;
    updateData.slug = slug;
    // Personal lists remain active when private, only check when public
    if (!newIsPublic) {
      updateData.isActive = true;
    }

    const updatedList = await dbQuery(() =>
      prisma.lists.update({
        where: { id },
        data: updateData,
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

    if (updatedList.userId) {
      checkAchievements(prisma, updatedList.userId).catch((e) => console.warn('Achievement check failed:', e));
    }

    return NextResponse.json({
      success: true,
      data: updatedList,
      message: 'لیست با موفقیت به‌روزرسانی شد',
    });
  } catch (error: any) {
    console.error('Error updating user list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در به‌روزرسانی لیست' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/lists/[id] - حذف لیست شخصی
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get user (session.user is guaranteed to exist after the check above)
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'احراز هویت نشده است' },
        { status: 401 }
      );
    }
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: userEmail },
      })
    );

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if list exists and belongs to user
    const existingList = await dbQuery(() =>
      prisma.lists.findUnique({
        where: { id },
      })
    );

    if (!existingList) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    if (existingList.userId !== user.id) {
      return NextResponse.json(
        { error: 'شما اجازه حذف این لیست را ندارید' },
        { status: 403 }
      );
    }

    // Delete list (cascade will handle related data)
    await dbQuery(() =>
      prisma.lists.delete({
        where: { id },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'لیست با موفقیت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting user list:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در حذف لیست' },
      { status: 500 }
    );
  }
}

