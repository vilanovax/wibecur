import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { shouldGracefulDbFallback } from '@/lib/db-errors';
import { fetchNotificationPreferences } from '@/lib/utils/notifications';

const EMPTY = {
  success: true as const,
  data: {
    notifications: [] as Array<{
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      link: string | null;
      read: boolean;
      createdAt: string;
    }>,
    unreadCount: 0,
    preferences: {
      allowBookmarkListNotifications: true,
      allowCommentNotifications: true,
    },
  },
};

// GET /api/notifications - دریافت پیام‌های کاربر
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id != null ? String(session.user.id) : '';
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found in session' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);

    const where: { userId: string; read?: boolean } = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, unreadCount] = await dbQuery(() =>
      Promise.all([
        prisma.notifications.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.notifications.count({
          where: { userId, read: false },
        }),
      ])
    );

    const preferences = await fetchNotificationPreferences(userId);

    const serialized = notifications.map((n) => ({
      ...n,
      createdAt:
        n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt ?? ''),
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: serialized,
        unreadCount,
        preferences,
      },
    });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      console.warn('Notifications DB fallback:', (error as Error)?.message);
      return NextResponse.json(EMPTY);
    }
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت پیام‌ها' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - علامت‌گذاری پیام‌ها به عنوان خوانده شده
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
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      await dbQuery(() =>
        prisma.notifications.updateMany({
          where: { userId, read: false },
          data: { read: true },
        })
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await dbQuery(() =>
        prisma.notifications.updateMany({
          where: {
            id: { in: notificationIds },
            userId,
          },
          data: { read: true },
        })
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'شناسه پیام یا markAllAsRead الزامی است' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'پیام‌ها به عنوان خوانده شده علامت‌گذاری شدند',
    });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      return NextResponse.json({
        success: true,
        message: 'پیام‌ها به عنوان خوانده شده علامت‌گذاری شدند',
      });
    }
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی پیام‌ها' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - حذف پیام‌ها
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id != null ? String(session.user.id) : '';
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found in session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, deleteRead } = body as {
      notificationIds?: string[];
      deleteRead?: boolean;
    };

    if (deleteRead) {
      await dbQuery(() =>
        prisma.notifications.deleteMany({
          where: { userId, read: true },
        })
      );
    } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      await dbQuery(() =>
        prisma.notifications.deleteMany({
          where: {
            id: { in: notificationIds },
            userId,
          },
        })
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'شناسه پیام یا deleteRead الزامی است' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'پیام‌ها حذف شدند',
    });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      return NextResponse.json({
        success: true,
        message: 'پیام‌ها حذف شدند',
      });
    }
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف پیام‌ها' },
      { status: 500 }
    );
  }
}
