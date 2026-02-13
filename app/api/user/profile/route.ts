import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { calculateCuratorResult } from '@/lib/curator';

// GET /api/user/profile - دریافت پروفایل کاربر
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let userId: string | undefined = session.user.id;
    
    // If userId is not available in session, try to get it from email
    if (!userId && session.user?.email) {
      const userByEmail = await prisma.users.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      userId = userByEmail?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found' },
        { status: 401 }
      );
    }

    const VIRAL_LIKE_THRESHOLD = 50;

    let user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      role: unknown;
      createdAt: Date;
      updatedAt: Date;
      bio?: string | null;
      username?: string | null;
      avatarType?: string;
      avatarId?: string | null;
      avatarStatus?: string | null;
      showBadge?: boolean;
      allowCommentNotifications?: boolean;
    } | null;

    try {
      user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          bio: true,
          username: true,
          avatarType: true,
          avatarId: true,
          avatarStatus: true,
          showBadge: true,
          allowCommentNotifications: true,
        },
      });
    } catch (dbError: unknown) {
      const msg = dbError instanceof Error ? dbError.message : '';
      if (msg.includes('column') && msg.includes('does not exist')) {
        user = await prisma.users.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        if (user) {
          (user as Record<string, unknown>).bio = null;
          (user as Record<string, unknown>).username = null;
          (user as Record<string, unknown>).avatarType = 'DEFAULT';
          (user as Record<string, unknown>).avatarId = null;
          (user as Record<string, unknown>).avatarStatus = null;
          (user as Record<string, unknown>).showBadge = true;
          (user as Record<string, unknown>).allowCommentNotifications = true;
        }
      } else {
        throw dbError;
      }
    }

    const [listsCount, bookmarksCount, likesCount, itemLikesCount, userLists, approvedItemsCount] = await Promise.all([
      prisma.lists.count({ where: { userId, isActive: true } }),
      prisma.bookmarks.count({ where: { userId } }),
      prisma.list_likes.count({ where: { userId } }),
      prisma.item_votes.count({ where: { userId } }),
      prisma.lists.findMany({
        where: { userId, isActive: true },
        select: {
          likeCount: true,
          viewCount: true,
          saveCount: true,
          itemCount: true,
          categoryId: true,
          categories: { select: { id: true, name: true, slug: true, icon: true } },
        },
      }),
      prisma.suggested_items.count({ where: { userId, status: 'approved' } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const totalLikesReceived = userLists.reduce((s, l) => s + (l.likeCount ?? 0), 0);
    const profileViews = userLists.reduce((s, l) => s + (l.viewCount ?? 0), 0);
    const totalItemsCurated = userLists.reduce((s, l) => s + (l.itemCount ?? 0), 0);
    const viralListsCount = userLists.filter((l) => (l.likeCount ?? 0) >= VIRAL_LIKE_THRESHOLD).length;
    const popularListsCount = userLists.filter((l) => (l.saveCount ?? 0) >= 10).length;
    const savedCount = userLists.reduce((s, l) => s + (l.saveCount ?? 0), 0);
    const avgLikesPerList = listsCount > 0 ? totalLikesReceived / listsCount : 0;

    const categoryCounts: Record<string, { name: string; slug: string; icon: string; count: number }> = {};
    for (const list of userLists) {
      const cat = list.categories;
      if (cat) {
        if (!categoryCounts[cat.id]) {
          categoryCounts[cat.id] = { name: cat.name, slug: cat.slug, icon: cat.icon, count: 0 };
        }
        categoryCounts[cat.id].count++;
      }
    }
    const expertise = Object.values(categoryCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const curatorResult = calculateCuratorResult({
      listsCount,
      avgLikesPerList,
      approvedItemsCount: approvedItemsCount ?? 0,
      savedCount,
      viralListsCount,
    });

    const fallbackUsername = user.username ?? (user.email?.includes('@') ? user.email.split('@')[0] : user.email ?? 'user');

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          username: user.username ?? fallbackUsername,
          bio: user.bio ?? null,
          avatarType: String(user.avatarType ?? 'DEFAULT'),
          avatarId: user.avatarId ?? null,
          avatarStatus: user.avatarStatus != null ? String(user.avatarStatus) : null,
          showBadge: user.showBadge ?? true,
          allowCommentNotifications: user.allowCommentNotifications ?? true,
          stats: {
            listsCreated: listsCount,
            bookmarks: bookmarksCount,
            likes: likesCount,
            itemLikes: itemLikesCount,
          },
          creatorStats: {
            viralListsCount,
            popularListsCount,
            totalLikesReceived,
            profileViews,
            totalItemsCurated,
          },
          expertise,
          curatorLevel: curatorResult.level,
          curatorScore: curatorResult.score,
          curatorNextLevelLabel: curatorResult.nextLevelLabel,
          curatorPointsToNext: curatorResult.pointsToNextLevel,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('Error fetching user profile:', message, stack);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - ویرایش پروفایل کاربر
export async function PUT(request: NextRequest) {
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
    const {
      name,
      email,
      username,
      bio,
      showBadge,
      allowCommentNotifications,
      avatarType,
      avatarId,
    } = body;

    // بررسی اینکه ایمیل تکراری نباشد (اگر تغییر کرده)
    if (email) {
      const existingUser = await prisma.users.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { success: false, error: 'این ایمیل قبلاً استفاده شده است' },
          { status: 400 }
        );
      }
    }

    // اعتبارسنجی username: فقط حروف انگلیسی، اعداد و _ ؛ طول ۳–۳۰
    if (username !== undefined && username !== null && username !== '') {
      const clean = String(username).trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
        return NextResponse.json(
          { success: false, error: 'نام کاربری فقط حروف انگلیسی، اعداد و _ (۳ تا ۳۰ کاراکتر)' },
          { status: 400 }
        );
      }
      const existing = await prisma.users.findUnique({
        where: { username: clean },
      });
      if (existing && existing.id !== userId) {
        return NextResponse.json(
          { success: false, error: 'این نام کاربری قبلاً استفاده شده است' },
          { status: 400 }
        );
      }
    }

    const updateData: {
      name?: string;
      email?: string;
      username?: string | null;
      bio?: string | null;
      showBadge?: boolean;
      allowCommentNotifications?: boolean;
      avatarType?: 'DEFAULT' | 'UPLOADED';
      avatarId?: string | null;
      avatarStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username === '' ? null : String(username).trim().toLowerCase();
    if (bio !== undefined) updateData.bio = bio === '' ? null : String(bio).slice(0, 160);
    if (typeof showBadge === 'boolean') updateData.showBadge = showBadge;
    if (typeof allowCommentNotifications === 'boolean') updateData.allowCommentNotifications = allowCommentNotifications;
    if (avatarType === 'DEFAULT' && avatarId) {
      updateData.avatarType = 'DEFAULT';
      updateData.avatarId = avatarId;
      updateData.avatarStatus = null;
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        bio: true,
        username: true,
        avatarType: true,
        avatarId: true,
        avatarStatus: true,
        showBadge: true,
        allowCommentNotifications: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

