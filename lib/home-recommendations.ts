/**
 * پیشنهادهای «برای تو» در Home — collaborative filtering سبک + دسته‌های محبوب
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import { publicCuratedListWhere } from '@/lib/public-content-filters';

const DEFAULT_LIMIT = 6;
const MIN_SEEDS = 1;

export type HomeRecommendationItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  saveCount: number;
  itemCount: number;
  likes: number;
  categories: { id: string; name: string; slug: string; icon: string; isActive?: boolean } | null;
  reasonType: 'similar' | 'category' | 'popular';
};

export type HomeRecommendationsResult = {
  lists: HomeRecommendationItem[];
  isPersonalized: boolean;
};

const listSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  saveCount: true,
  itemCount: true,
  likeCount: true,
  categoryId: true,
  categories: { select: { id: true, name: true, slug: true, icon: true, isActive: true } },
} as const;

function mapList(
  l: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    saveCount: number | null;
    itemCount: number | null;
    likeCount: number | null;
    categories: HomeRecommendationItem['categories'];
  },
  reasonType: HomeRecommendationItem['reasonType']
): HomeRecommendationItem | null {
  if (l.categories?.isActive === false) return null;
  return {
    id: l.id,
    title: l.title,
    slug: l.slug,
    description: l.description ?? '',
    coverImage: resolveCoverImage({
      coverImage: l.coverImage,
      categorySlug: l.categories?.slug,
      listSlug: l.slug,
      listTitle: l.title,
    }),
    saveCount: l.saveCount ?? 0,
    itemCount: l.itemCount ?? 0,
    likes: l.likeCount ?? 0,
    categories: l.categories,
    reasonType,
  };
}

async function fetchPopularLists(
  prisma: PrismaClient,
  excludeIds: Set<string>,
  limit: number
): Promise<HomeRecommendationItem[]> {
  const rows = await prisma.lists.findMany({
    where: {
      ...publicCuratedListWhere,
      ...(excludeIds.size > 0 ? { id: { notIn: [...excludeIds] } } : {}),
    },
    select: listSelect,
    orderBy: [{ saveCount: 'desc' }, { likeCount: 'desc' }],
    take: limit,
  });
  return rows
    .map((l) => mapList(l, 'popular'))
    .filter((x): x is HomeRecommendationItem => x !== null);
}

/**
 * لیست‌هایی که کاربران با علایق مشابه (بر اساس ذخیره‌ها) ذخیره کرده‌اند
 */
async function fetchCollaborativeCandidates(
  prisma: PrismaClient,
  userId: string,
  seedListIds: string[],
  excludeIds: Set<string>,
  limit: number
): Promise<{ listId: string; score: number }[]> {
  if (seedListIds.length === 0) return [];

  const excludeArr = [...excludeIds];
  const rows = await prisma.$queryRaw<{ listId: string; score: number }[]>(
    Prisma.sql`
      SELECT b2."listId", COUNT(DISTINCT b2."userId")::int AS score
      FROM bookmarks b1
      INNER JOIN bookmarks b2
        ON b1."userId" = b2."userId"
        AND b2."listId" != b1."listId"
      INNER JOIN lists l ON l.id = b2."listId"
      LEFT JOIN categories c ON c.id = l."categoryId"
      WHERE b1."userId" = ${userId}
        AND b1."listId" IN (${Prisma.join(seedListIds)})
        AND l."isActive" = true
        AND l."isPublic" = true
        AND (l."categoryId" IS NULL OR (c."isActive" = true AND c."deletedAt" IS NULL))
        ${excludeArr.length > 0 ? Prisma.sql`AND b2."listId" NOT IN (${Prisma.join(excludeArr)})` : Prisma.empty}
      GROUP BY b2."listId"
      ORDER BY score DESC
      LIMIT ${limit}
    `
  );
  return rows;
}

async function fetchPreferredCategoryIds(
  prisma: PrismaClient,
  userId: string
): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ categoryId: string; cnt: number }[]>(
    Prisma.sql`
      SELECT l."categoryId", COUNT(*)::int AS cnt
      FROM bookmarks b
      INNER JOIN lists l ON l.id = b."listId"
      INNER JOIN categories c ON c.id = l."categoryId"
      WHERE b."userId" = ${userId}
        AND l."categoryId" IS NOT NULL
        AND c."isActive" = true
        AND c."deletedAt" IS NULL
      GROUP BY l."categoryId"
      ORDER BY cnt DESC
      LIMIT 5
    `
  );
  return rows.map((r) => r.categoryId).filter(Boolean);
}

async function fetchCategoryLists(
  prisma: PrismaClient,
  categoryIds: string[],
  excludeIds: Set<string>,
  limit: number
): Promise<HomeRecommendationItem[]> {
  if (categoryIds.length === 0) return [];

  const activeCats = await prisma.categories.findMany({
    where: { id: { in: categoryIds }, isActive: true, deletedAt: null },
    select: { id: true },
  });
  const activeCatIds = activeCats.map((c) => c.id);
  if (activeCatIds.length === 0) return [];

  const rows = await prisma.lists.findMany({
    where: {
      ...publicCuratedListWhere,
      categoryId: { in: activeCatIds },
      ...(excludeIds.size > 0 ? { id: { notIn: [...excludeIds] } } : {}),
    },
    select: listSelect,
    orderBy: [{ saveCount: 'desc' }, { likeCount: 'desc' }],
    take: limit,
  });
  return rows
    .map((l) => mapList(l, 'category'))
    .filter((x): x is HomeRecommendationItem => x !== null);
}

export async function getHomeRecommendationsForUser(
  prisma: PrismaClient,
  userId: string | null,
  limit: number = DEFAULT_LIMIT
): Promise<HomeRecommendationsResult> {
  if (!userId) {
    const lists = await fetchPopularLists(prisma, new Set(), limit);
    return { lists, isPersonalized: false };
  }

  const [bookmarks, likes, ownedListIds] = await Promise.all([
    prisma.bookmarks.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { listId: true },
    }),
    prisma.list_likes.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { listId: true },
    }),
    prisma.lists.findMany({
      where: { userId },
      select: { id: true },
    }),
  ]);

  const excludeIds = new Set<string>([
    ...bookmarks.map((b) => b.listId),
    ...likes.map((l) => l.listId),
    ...ownedListIds.map((l) => l.id),
  ]);

  const seedListIds = [
    ...new Set([
      ...bookmarks.slice(0, 8).map((b) => b.listId),
      ...likes.slice(0, 4).map((l) => l.listId),
    ]),
  ];

  if (seedListIds.length < MIN_SEEDS) {
    const lists = await fetchPopularLists(prisma, excludeIds, limit);
    return { lists, isPersonalized: false };
  }

  const pickedIds = new Set<string>();
  const result: HomeRecommendationItem[] = [];

  const addUnique = (items: HomeRecommendationItem[]) => {
    for (const item of items) {
      if (pickedIds.has(item.id) || excludeIds.has(item.id)) continue;
      result.push(item);
      pickedIds.add(item.id);
      if (result.length >= limit) break;
    }
  };

  const [collabRows, preferredCategories] = await Promise.all([
    fetchCollaborativeCandidates(prisma, userId, seedListIds, excludeIds, limit * 2),
    fetchPreferredCategoryIds(prisma, userId),
  ]);

  if (collabRows.length > 0) {
    const collabLists = await prisma.lists.findMany({
      where: {
        ...publicCuratedListWhere,
        id: { in: collabRows.map((r) => r.listId) },
      },
      select: listSelect,
    });
    const scoreById = new Map(collabRows.map((r) => [r.listId, r.score]));
    const sorted = collabLists.sort(
      (a, b) => (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0)
    );
    addUnique(
      sorted
        .map((l) => mapList(l, 'similar'))
        .filter((x): x is HomeRecommendationItem => x !== null)
    );
  }

  if (result.length < limit && preferredCategories.length > 0) {
    const categoryLists = await fetchCategoryLists(
      prisma,
      preferredCategories,
      new Set([...excludeIds, ...pickedIds]),
      limit - result.length + 4
    );
    addUnique(categoryLists);
  }

  if (result.length < limit) {
    const popular = await fetchPopularLists(
      prisma,
      new Set([...excludeIds, ...pickedIds]),
      limit - result.length
    );
    addUnique(popular);
  }

  return {
    lists: result.slice(0, limit),
    isPersonalized: collabRows.length > 0 || preferredCategories.length > 0,
  };
}
