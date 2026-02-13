import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/** POST /api/follow/[userId] — دنبال کردن */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: followingId } = await params;
    const followerId = session.user.id;

    if (followerId === followingId) {
      return NextResponse.json(
        { success: false, error: 'نمی‌توانید خودتان را دنبال کنید' },
        { status: 400 }
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const followsToday = await prisma.follows.count({
      where: { followerId, createdAt: { gte: todayStart } },
    });
    if (followsToday >= 50) {
      return NextResponse.json(
        { success: false, error: 'امروز به حد مجاز دنبال کردن رسیده‌اید. فردا دوباره امتحان کنید.' },
        { status: 429 }
      );
    }

    const target = await prisma.users.findUnique({
      where: { id: followingId },
      select: { id: true, isActive: true },
    });
    if (!target || !target.isActive) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    await prisma.follows.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      create: { followerId, followingId },
      update: {},
    });

    await prisma.discovery_spotlight_cache.deleteMany({ where: { userId: followerId } });

    const [followersCount, followingCount] = await Promise.all([
      prisma.follows.count({ where: { followingId } }),
      prisma.follows.count({ where: { followerId: followingId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { isFollowing: true, followersCount, followingCount },
    });
  } catch (error: unknown) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در دنبال کردن' },
      { status: 500 }
    );
  }
}

/** DELETE /api/follow/[userId] — لغو دنبال کردن */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: followingId } = await params;
    const followerId = session.user.id;

    await prisma.follows.deleteMany({
      where: { followerId, followingId },
    });

    const [followersCount, followingCount] = await Promise.all([
      prisma.follows.count({ where: { followingId } }),
      prisma.follows.count({ where: { followerId: followingId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { isFollowing: false, followersCount, followingCount },
    });
  } catch (error: unknown) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا در لغو دنبال کردن' },
      { status: 500 }
    );
  }
}

/** GET /api/follow/[userId] — وضعیت دنبال (isFollowing) + تعداد برای آن کاربر */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetId } = await params;
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    const [followersCount, followingCount, isFollowing] = await Promise.all([
      prisma.follows.count({ where: { followingId: targetId } }),
      prisma.follows.count({ where: { followerId: targetId } }),
      currentUserId
        ? prisma.follows
            .findUnique({
              where: {
                followerId_followingId: { followerId: currentUserId, followingId: targetId },
              },
            })
            .then((r) => !!r)
        : Promise.resolve(false),
    ]);

    return NextResponse.json({
      success: true,
      data: { isFollowing, followersCount, followingCount },
    });
  } catch (error: unknown) {
    console.error('Follow status error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
