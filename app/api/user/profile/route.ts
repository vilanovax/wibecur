import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET /api/user/profile - دریافت پروفایل کاربر
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let userId = (session.user as any).id;
    
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

    // دریافت اطلاعات کاربر به همراه آمار
    const [user, listsCount, bookmarksCount, likesCount, itemLikesCount] = await Promise.all([
      prisma.users.findUnique({
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
      }),
      prisma.lists.count({ where: { userId } }),
      prisma.bookmarks.count({ where: { userId } }),
      prisma.list_likes.count({ where: { userId } }),
      prisma.item_votes.count({ where: { userId } }), // آیتم‌هایی که کاربر لایک کرده
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          stats: {
            listsCreated: listsCount,
            bookmarks: bookmarksCount,
            likes: likesCount,
            itemLikes: itemLikesCount, // تعداد آیتم‌هایی که کاربر لایک کرده
          },
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - ویرایش پروفایل کاربر
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { name, email } = body;

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

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        updatedAt: new Date(),
      },
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

