import { cache } from 'react';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { dbQuery } from './db';
import { calculateCuratorResult } from './curator';
import type { ProfileUser } from '@/components/profile/types';

const VIRAL_LIKE_THRESHOLD = 50;
const POPULAR_SAVE_THRESHOLD = 10;

export type ApiProfileUser = ProfileUser & {
  role: unknown;
  createdAt: Date;
  updatedAt: Date;
  allowCommentNotifications: boolean;
  allowBookmarkListNotifications: boolean;
};

type ListAggRow = {
  lists_count: number;
  total_likes: number;
  profile_views: number;
  total_items: number;
  saved_count: number;
  viral_count: number;
  popular_count: number;
};

type ExpertiseRow = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
};

/** پروفایل کامل کاربر — برای SSR و API (per-request dedupe) */
export const fetchProfileUser = cache(
  async (userId: string): Promise<ProfileUser | null> => {
    return fetchApiProfileUser(userId);
  }
);

/**
 * Perf: SQL aggregates instead of loading every list row into Node
 * for viral/popular/expertise stats (async-parallel counts).
 */
export async function fetchApiProfileUser(
  userId: string
): Promise<ApiProfileUser | null> {
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
      allowBookmarkListNotifications?: boolean;
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
          allowBookmarkListNotifications: true,
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
          allowBookmarkListNotifications: true,
          avatarType: 'DEFAULT',
          avatarId: null,
          avatarStatus: null,
        });
      }
    }

    if (!user) return null;

    const [
      listAggRows,
      expertiseRows,
      bookmarksCount,
      likesCount,
      itemLikesCount,
      approvedItemsCount,
    ] = await Promise.all([
      prisma.$queryRaw<ListAggRow[]>(Prisma.sql`
        SELECT
          COUNT(*)::int AS lists_count,
          COALESCE(SUM(l."likeCount"), 0)::int AS total_likes,
          COALESCE(SUM(l."viewCount"), 0)::int AS profile_views,
          COALESCE(SUM(l."itemCount"), 0)::int AS total_items,
          COALESCE(SUM(l."saveCount"), 0)::int AS saved_count,
          COUNT(*) FILTER (WHERE l."likeCount" >= ${VIRAL_LIKE_THRESHOLD})::int AS viral_count,
          COUNT(*) FILTER (WHERE l."saveCount" >= ${POPULAR_SAVE_THRESHOLD})::int AS popular_count
        FROM lists l
        WHERE l."userId" = ${userId}
          AND l."isActive" = true
          AND l."deletedAt" IS NULL
      `),
      prisma.$queryRaw<ExpertiseRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.name,
          c.slug,
          c.icon,
          COUNT(*)::int AS count
        FROM lists l
        INNER JOIN categories c ON c.id = l."categoryId"
        WHERE l."userId" = ${userId}
          AND l."isActive" = true
          AND l."deletedAt" IS NULL
          AND l."categoryId" IS NOT NULL
        GROUP BY c.id, c.name, c.slug, c.icon
        ORDER BY count DESC
        LIMIT 5
      `),
      prisma.bookmarks.count({ where: { userId } }),
      prisma.list_likes.count({ where: { userId } }),
      prisma.item_votes.count({ where: { userId } }),
      prisma.suggested_items.count({ where: { userId, status: 'approved' } }),
    ]);

    const agg = listAggRows[0];
    const listsCount = agg?.lists_count ?? 0;
    const totalLikesReceived = agg?.total_likes ?? 0;
    const profileViews = agg?.profile_views ?? 0;
    const totalItemsCurated = agg?.total_items ?? 0;
    const savedCount = agg?.saved_count ?? 0;
    const viralListsCount = agg?.viral_count ?? 0;
    const popularListsCount = agg?.popular_count ?? 0;
    const avgLikesPerList = listsCount > 0 ? totalLikesReceived / listsCount : 0;

    const expertise = (expertiseRows as ExpertiseRow[]).map((row: ExpertiseRow) => ({
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      count: Number(row.count) || 0,
    }));

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
      allowBookmarkListNotifications: user.allowBookmarkListNotifications ?? true,
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
