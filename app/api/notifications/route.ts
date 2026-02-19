import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

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

    const rawUserId = session.user.id;
    const userId = rawUserId != null ? String(rawUserId) : '';

    if (!userId) {
      console.error('User ID not found in session:', session);
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

    let notifications: Awaited<ReturnType<typeof prisma.notifications.findMany>>;
    let unreadCount: number;

    try {
      notifications = await dbQuery(() =>
        prisma.notifications.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
      );
      unreadCount = await dbQuery(() =>
        prisma.notifications.count({
          where: { userId, read: false },
        })
      );
    } catch (dbError: unknown) {
      console.error('Notifications DB error:', dbError);
      const msg = dbError instanceof Error ? dbError.message : String(dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'خطا در دریافت پیام‌ها',
          details: process.env.NODE_ENV === 'development' ? msg : undefined,
        },
        { status: 500 }
      );
    }

    const serialized = notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt ?? ''),
    }));

    return NextResponse.json({
      success: true,
      data: {
        notifications: serialized,
        unreadCount,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching notifications:', err.message, err.stack);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'خطا در دریافت پیام‌ها',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
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
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'خطا در بروزرسانی پیام‌ها' },
      { status: 500 }
    );
  }
}

