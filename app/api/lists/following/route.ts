import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/lists/following
 * لیست‌های جدید از کریتورهایی که کاربر دنبال می‌کند.
 * مرتب‌سازی: newest، سپس بر اساس engagement (saveCount, likeCount).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: { lists: [], message: 'login_required' },
      });
    }

    const followed = await prisma.follows.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    const followingIds = followed.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { lists: [], message: 'no_following' },
      });
    }

    const lists = await prisma.lists.findMany({
      where: {
        userId: { in: followingIds },
        isActive: true,
        isPublic: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        saveCount: true,
        itemCount: true,
        likeCount: true,
        viewCount: true,
        updatedAt: true,
        isFeatured: true,
        badge: true,
        userId: true,
        categories: { select: { id: true, name: true, slug: true, icon: true } },
        users: { select: { id: true, name: true, username: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { saveCount: 'desc' }, { likeCount: 'desc' }],
      take: 30,
    });

    const mapped = lists.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? '',
      coverImage: l.coverImage ?? '',
      saveCount: l.saveCount ?? 0,
      itemCount: l.itemCount ?? 0,
      likes: l.likeCount ?? 0,
      views: l.viewCount ?? 0,
      updatedAt: l.updatedAt,
      isFeatured: l.isFeatured ?? false,
      badge: l.badge?.toLowerCase(),
      categories: l.categories,
      creator: l.users ? { id: l.users.id, name: l.users.name, username: l.users.username } : null,
    }));

    return NextResponse.json({
      success: true,
      data: { lists: mapped },
    });
  } catch (error: unknown) {
    console.error('Lists following error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
