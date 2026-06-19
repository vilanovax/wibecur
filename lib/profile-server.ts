import { prisma } from './prisma';
import { dbQuery } from './db';
import { calculateCuratorResult } from './curator';
import type { ProfileUser } from '@/components/profile/types';

const VIRAL_LIKE_THRESHOLD = 50;

export type ApiProfileUser = ProfileUser & {
  role: unknown;
  createdAt: Date;
  updatedAt: Date;
  allowCommentNotifications: boolean;
};

/** پروفایل کامل کاربر — برای SSR و API */
export async function fetchProfileUser(userId: string): Promise<ProfileUser | null> {
  const api = await fetchApiProfileUser(userId);
  return api;
}

export async function fetchApiProfileUser(userId: string): Promise<ApiProfileUser | null> {
  return dbQuery(async () => {
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
      const isUnknownField =
        (dbError as { name?: string }).name === 'PrismaClientValidationError' ||
        msg.includes('Unknown field');
      const isMissingColumn = msg.includes('column') && msg.includes('does not exist');
      if (!isMissingColumn && !isUnknownField) throw dbError;

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
        Object.assign(user, {
          bio: null,
          username: null,
          showBadge: true,
          allowCommentNotifications: true,
          avatarType: 'DEFAULT',
          avatarId: null,
          avatarStatus: null,
        });
      }
    }

    if (!user) return null;

    const [listsCount, bookmarksCount, likesCount, itemLikesCount, userLists, approvedItemsCount] =
      await Promise.all([
        prisma.lists.count({ where: { userId, isActive: true, deletedAt: null } }),
        prisma.bookmarks.count({ where: { userId } }),
        prisma.list_likes.count({ where: { userId } }),
        prisma.item_votes.count({ where: { userId } }),
        prisma.lists.findMany({
          where: { userId, isActive: true, deletedAt: null },
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

    const totalLikesReceived = userLists.reduce((s, l) => s + (l.likeCount ?? 0), 0);
    const profileViews = userLists.reduce((s, l) => s + (l.viewCount ?? 0), 0);
    const totalItemsCurated = userLists.reduce((s, l) => s + (l.itemCount ?? 0), 0);
    const viralListsCount = userLists.filter((l) => (l.likeCount ?? 0) >= VIRAL_LIKE_THRESHOLD).length;
    const popularListsCount = userLists.filter((l) => (l.saveCount ?? 0) >= 10).length;
    const savedCount = userLists.reduce((s, l) => s + (l.saveCount ?? 0), 0);
    const avgLikesPerList = listsCount > 0 ? totalLikesReceived / listsCount : 0;

    const categoryCounts: Record<string, { name: string; slug: string; icon: string; count: number }> =
      {};
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

    const fallbackUsername =
      user.username ??
      (user.email?.includes('@') ? user.email.split('@')[0] : user.email ?? 'user');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      username: user.username ?? fallbackUsername,
      bio: user.bio ?? null,
      avatarType: (String(user.avatarType ?? 'DEFAULT') === 'UPLOADED' ? 'UPLOADED' : 'DEFAULT') as
        | 'DEFAULT'
        | 'UPLOADED',
      avatarId: user.avatarId ?? null,
      avatarStatus: (user.avatarStatus != null
        ? String(user.avatarStatus)
        : null) as ProfileUser['avatarStatus'],
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
        totalSavesReceived: savedCount,
        profileViews,
        totalItemsCurated,
      },
      expertise,
      curatorLevel: curatorResult.level,
      curatorScore: curatorResult.score,
      curatorNextLevelLabel: curatorResult.nextLevelLabel,
      curatorPointsToNext: curatorResult.pointsToNextLevel,
    };
  });
}
