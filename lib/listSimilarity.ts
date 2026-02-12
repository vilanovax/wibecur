/**
 * Similar Lists هوشمند — امتیاز شباهت بر اساس تگ، دسته، محبوبیت و رفتار کاربر (Save)
 * بدون ML، بدون سرویس خارجی، collaborative filtering سبک
 */

import { Prisma, type PrismaClient } from '@prisma/client';

// --- انواع برای محاسبه امتیاز (حداقل فیلدهای لازم) ---
export type ListForSimilarity = {
  id: string;
  categoryId: string | null;
  saveCount: number;
  tags: string[];
  items: { title: string }[];
};

export type CandidateRow = ListForSimilarity & {
  title: string;
  slug: string;
  coverImage: string | null;
  itemCount: number;
  categories: { id: string; name: string; slug: string; icon: string } | null;
};

// خروجی نهایی همان شکل relatedLists فعلی
export type SimilarListOutput = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount: number;
  itemCount: number;
  categories: { id: string; name: string; slug: string; icon: string } | null;
};

// رفتار Save: لیست‌هایی که کاربرانِ «ذخیره‌کننده این لیست» آنها را هم ذخیره کرده‌اند
export type BehaviorOverlapResult = {
  totalUsers: number;
  listScores: { listId: string; overlapCount: number; behaviorScore: number }[];
};

const CANDIDATES_LIMIT = 30;
const TOP_N = 4;
const MIN_SAVES_FOR_BEHAVIOR = 5;
const BEHAVIOR_WEIGHT = 0.6;
const TAG_WEIGHT = 0.4;
const BEHAVIOR_OVERLAP_LIMIT = 10;

/**
 * نرمال‌سازی عنوان برای مقایسه overlap آیتم‌ها
 */
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * تعداد تگ‌های مشترک
 */
function tagOverlapCount(currentTags: string[], candidateTags: string[]): number {
  const set = new Set(candidateTags);
  return currentTags.filter((t) => set.has(t)).length;
}

/**
 * تعداد آیتم‌های مشترک (بر اساس عنوان نرمال‌شده)، حداکثر ۳ برای بونوس
 */
function sharedItemCount(
  currentTitles: string[],
  candidateTitles: string[]
): number {
  const set = new Set(candidateTitles.map(normalizeTitle));
  const shared = currentTitles.filter((t) => set.has(normalizeTitle(t)));
  return Math.min(shared.length, 3); // حداکثر ۳ تا برای بونوس ۰.۳
}

/**
 * امتیاز شباهت بین لیست فعلی و یک کاندید
 * score = (0.5 × tagOverlapCount) + (0.3 × sameCategory) + (0.2 × normalizedSaveSimilarity)
 * اختیاری: +0.1 per shared item (max 0.3)
 */
export function calculateSimilarityScore(
  currentList: ListForSimilarity,
  candidateList: ListForSimilarity,
  maxSaveCount: number
): number {
  const tagOverlap = tagOverlapCount(currentList.tags, candidateList.tags);
  const sameCategory =
    currentList.categoryId && currentList.categoryId === candidateList.categoryId
      ? 1
      : 0;

  // جلوگیری از تقسیم بر صفر
  const denominator = Math.max(maxSaveCount, 1);
  const normalizedSaveSimilarity = Math.max(
    0,
    Math.min(
      1,
      1 -
        Math.abs(currentList.saveCount - candidateList.saveCount) / denominator
    )
  );

  let score =
    0.5 * tagOverlap + 0.3 * sameCategory + 0.2 * normalizedSaveSimilarity;

  // بونوس overlap آیتم‌ها (حداکثر ۰.۳)
  const currentTitles = currentList.items.map((i) => i.title);
  const candidateTitles = candidateList.items.map((i) => i.title);
  const shared = sharedItemCount(currentTitles, candidateTitles);
  score += 0.1 * shared;

  return score;
}

// --- رفتار Save (Collaborative filtering سبک) ---

/**
 * تعداد کاربرانی که این لیست را Save کرده‌اند
 */
async function fetchUsersWhoSavedCount(
  prisma: PrismaClient,
  currentListId: string
): Promise<number> {
  const rows = await prisma.$queryRaw<[{ total: number }]>(
    Prisma.sql`SELECT COUNT(DISTINCT "userId")::int AS total FROM bookmarks WHERE "listId" = ${currentListId}`
  );
  return rows[0]?.total ?? 0;
}

/**
 * لیست‌هایی که همان کاربران (ذخیره‌کنندگان لیست فعلی) آنها را هم Save کرده‌اند
 * خروجی: listId و overlapCount؛ از index روی listId و userId استفاده می‌کند
 */
async function fetchOverlapLists(
  prisma: PrismaClient,
  currentListId: string
): Promise<{ listId: string; overlapCount: number }[]> {
  const rows = await prisma.$queryRaw<{ listId: string; overlapCount: number }[]>(
    Prisma.sql`
      SELECT b."listId", COUNT(*)::int AS "overlapCount"
      FROM bookmarks b
      WHERE b."userId" IN (SELECT "userId" FROM bookmarks WHERE "listId" = ${currentListId})
        AND b."listId" != ${currentListId}
      GROUP BY b."listId"
      ORDER BY "overlapCount" DESC
      LIMIT ${BEHAVIOR_OVERLAP_LIMIT}
    `
  );
  return rows;
}

/**
 * امتیاز رفتاری: کاربرانی که این لیست را Save کردند، چه لیست‌های دیگری Save کردند؟
 * Fallback: اگر totalSaves < MIN_SAVES_FOR_BEHAVIOR یا هیچ overlap نباشد، null برمی‌گرداند
 */
export async function getBehaviorSimilarLists(
  prisma: PrismaClient,
  currentListId: string
): Promise<BehaviorOverlapResult | null> {
  const totalUsers = await fetchUsersWhoSavedCount(prisma, currentListId);
  if (totalUsers < MIN_SAVES_FOR_BEHAVIOR) return null;

  const overlapRows = await fetchOverlapLists(prisma, currentListId);
  if (overlapRows.length === 0) return null;

  const listScores = overlapRows.map((row) => ({
    listId: row.listId,
    overlapCount: row.overlapCount,
    behaviorScore: row.overlapCount / totalUsers,
  }));

  return { totalUsers, listScores };
}

/**
 * واکشی کاندیدها: هم‌دسته یا حداقل یک تگ مشترک
 * فقط فیلدهای لازم، حداکثر CANDIDATES_LIMIT
 */
export async function fetchCandidates(
  prisma: PrismaClient,
  currentList: ListForSimilarity
): Promise<CandidateRow[]> {
  const hasTags = currentList.tags.length > 0;
  const hasCategory = !!currentList.categoryId;

  const orConditions: { categoryId: string } | { tags: { hasSome: string[] } }[] =
    [];
  if (hasCategory) orConditions.push({ categoryId: currentList.categoryId! });
  if (hasTags) orConditions.push({ tags: { hasSome: currentList.tags } });

  if (orConditions.length === 0) {
    return [];
  }

  const rows = await prisma.lists.findMany({
    where: {
      id: { not: currentList.id },
      isActive: true,
      isPublic: true,
      users: { role: { not: 'USER' } },
      OR: orConditions,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      saveCount: true,
      itemCount: true,
      categoryId: true,
      tags: true,
      categories: { select: { id: true, name: true, slug: true, icon: true } },
      items: { select: { title: true } },
    },
    take: CANDIDATES_LIMIT,
  });

  return rows as CandidateRow[];
}

/**
 * محاسبه امتیاز برای همه کاندیدها و مرتب‌سازی
 */
function computeScores(
  currentList: ListForSimilarity,
  candidates: CandidateRow[]
): CandidateRow[] {
  const allSaveCounts = [
    currentList.saveCount,
    ...candidates.map((c) => c.saveCount),
  ];
  const maxSaveCount = Math.max(...allSaveCounts, 1);

  const withScore = candidates.map((c) => ({
    candidate: c,
    score: calculateSimilarityScore(currentList, c, maxSaveCount),
  }));

  withScore.sort((a, b) => b.score - a.score);
  return withScore.map((x) => x.candidate);
}

/**
 * Fallback: هم‌دسته، مرتب‌سازی با saveCount نزولی
 */
async function fetchFallbackByCategory(
  prisma: PrismaClient,
  currentListId: string,
  categoryId: string,
  take: number
): Promise<SimilarListOutput[]> {
  const rows = await prisma.lists.findMany({
    where: {
      id: { not: currentListId },
      categoryId,
      isActive: true,
      isPublic: true,
      users: { role: { not: 'USER' } },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      saveCount: true,
      itemCount: true,
      categories: { select: { id: true, name: true, slug: true, icon: true } },
    },
    orderBy: { saveCount: 'desc' },
    take,
  });
  return rows as SimilarListOutput[];
}

/**
 * Fallback نهایی: محبوب‌ترین لیست‌های سراسری (بدون لیست فعلی)
 */
async function fetchFallbackGlobal(
  prisma: PrismaClient,
  currentListId: string,
  take: number
): Promise<SimilarListOutput[]> {
  const rows = await prisma.lists.findMany({
    where: {
      id: { not: currentListId },
      isActive: true,
      isPublic: true,
      users: { role: { not: 'USER' } },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      saveCount: true,
      itemCount: true,
      categories: { select: { id: true, name: true, slug: true, icon: true } },
    },
    orderBy: { saveCount: 'desc' },
    take,
  });
  return rows as SimilarListOutput[];
}

/**
 * خروجی: ۳–۴ لیست مشابه با امتیاز ترکیبی (رفتار + تگ) و fallback منطقی
 */
export async function getTopSimilarLists(
  prisma: PrismaClient,
  currentList: ListForSimilarity
): Promise<SimilarListOutput[]> {
  const pickedIds = new Set<string>();
  let result: SimilarListOutput[] = [];

  const toOutput = (c: CandidateRow): SimilarListOutput => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    coverImage: c.coverImage,
    saveCount: c.saveCount,
    itemCount: c.itemCount,
    categories: c.categories,
  });

  // ۱) امتیاز رفتاری: «کاربرانی که این لیست را Save کردند، چه لیست‌های دیگری Save کردند؟»
  const behaviorResult = await getBehaviorSimilarLists(prisma, currentList.id);

  if (behaviorResult && behaviorResult.listScores.length > 0) {
    const listIds = behaviorResult.listScores.map((s) => s.listId);
    const behaviorByListId = new Map(
      behaviorResult.listScores.map((s) => [s.listId, s.behaviorScore])
    );

    const candidateRows = await prisma.lists.findMany({
      where: {
        id: { in: listIds },
        isActive: true,
        isPublic: true,
        users: { role: { not: 'USER' } },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        saveCount: true,
        itemCount: true,
        categoryId: true,
        tags: true,
        categories: { select: { id: true, name: true, slug: true, icon: true } },
        items: { select: { title: true } },
      },
    });

    const candidates = candidateRows as CandidateRow[];
    const maxSaveCount = Math.max(
      currentList.saveCount,
      ...candidates.map((c) => c.saveCount),
      1
    );

    const tagScores = candidates.map((c) =>
      calculateSimilarityScore(currentList, c, maxSaveCount)
    );
    const maxTagScore = Math.max(...tagScores, 1);

    const withFinalScore = candidates.map((c, i) => {
      const behaviorScore = behaviorByListId.get(c.id) ?? 0;
      const tagScoreNorm = tagScores[i]! / maxTagScore;
      const finalScore =
        BEHAVIOR_WEIGHT * behaviorScore + TAG_WEIGHT * tagScoreNorm;
      return { candidate: c, finalScore };
    });

    withFinalScore.sort((a, b) => b.finalScore - a.finalScore);
    const fromBehavior = withFinalScore.slice(0, TOP_N).map((x) => toOutput(x.candidate));
    fromBehavior.forEach((r) => pickedIds.add(r.id));
    result.push(...fromBehavior);
    if (result.length >= TOP_N) return result.slice(0, TOP_N);
  }

  // ۲) Fallback یا تکمیل: کاندیدهای تگ/دسته
  const candidates = await fetchCandidates(prisma, currentList);
  if (candidates.length > 0) {
    const sorted = computeScores(currentList, candidates);
    for (const c of sorted) {
      if (!pickedIds.has(c.id) && result.length < TOP_N) {
        result.push(toOutput(c));
        pickedIds.add(c.id);
      }
    }
  }

  if (result.length >= TOP_N) return result.slice(0, TOP_N);

  // ۳) Fallback: هم‌دسته، order by saveCount
  if (currentList.categoryId) {
    const byCategory = await fetchFallbackByCategory(
      prisma,
      currentList.id,
      currentList.categoryId,
      TOP_N + 10
    );
    for (const row of byCategory) {
      if (!pickedIds.has(row.id) && result.length < TOP_N) {
        result.push(row);
        pickedIds.add(row.id);
      }
    }
  }

  if (result.length >= TOP_N) return result.slice(0, TOP_N);

  // ۴) Fallback نهایی: محبوب سراسری
  const need = TOP_N - result.length;
  const global = await fetchFallbackGlobal(prisma, currentList.id, need + 10);
  for (const row of global) {
    if (!pickedIds.has(row.id) && result.length < TOP_N) {
      result.push(row);
      pickedIds.add(row.id);
    }
  }

  return result.slice(0, TOP_N);
}
