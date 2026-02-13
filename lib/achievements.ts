/**
 * Achievement Badge System — creator-focused, quality-based.
 * Categories: creation | impact | community | consistency
 */

import type { PrismaClient } from '@prisma/client';

const VIRAL_LIKE_THRESHOLD = 50;

export const ACHIEVEMENT_DEFINITIONS = [
  { code: 'FIRST_VIBE', title: 'First Vibe', description: 'ساخت اولین لیست عمومی', category: 'creation', tier: 'bronze', icon: '🥉', isSecret: false },
  { code: 'FIVE_LISTS', title: '۵ لیست', description: '۵ لیست منتشر شده', category: 'creation', tier: 'bronze', icon: '🥈', isSecret: false },
  { code: 'TWENTY_LISTS', title: '۲۰ لیست', description: '۲۰ لیست فعال', category: 'creation', tier: 'silver', icon: '🥇', isSecret: false },
  { code: 'MASTER_CURATOR', title: 'Master Curator', description: '۵۰ لیست با تعامل بالا', category: 'creation', tier: 'elite', icon: '🏆', isSecret: false },
  { code: 'VIRAL_SPARK', title: 'Viral Spark', description: 'یک لیست وایرال شده', category: 'impact', tier: 'silver', icon: '🔥', isSecret: false },
  { code: 'TREND_MAKER', title: 'Trend Maker', description: '۳ لیست وایرال', category: 'impact', tier: 'gold', icon: '🔥', isSecret: false },
  { code: 'SAVES_100', title: '۱۰۰ ذخیره', description: 'یک لیست با ۱۰۰+ ذخیره', category: 'impact', tier: 'silver', icon: '⭐', isSecret: false },
  { code: 'SAVES_500', title: '۵۰۰ ذخیره', description: 'یک لیست با ۵۰۰+ ذخیره', category: 'impact', tier: 'gold', icon: '💎', isSecret: false },
  { code: 'HELPFUL_VOICE', title: 'Helpful Voice', description: '۱۰ رای مفید روی کامنت‌ها', category: 'community', tier: 'bronze', icon: '🤝', isSecret: false },
  { code: 'INSIGHTFUL_CURATOR', title: 'Insightful Curator', description: '۵ پیشنهاد آیتم تایید شده', category: 'community', tier: 'silver', icon: '🧠', isSecret: false },
  { code: 'COMMUNITY_FAVORITE', title: 'Community Favorite', description: '۱۰۰ لایک مجموع روی لیست‌ها', category: 'community', tier: 'silver', icon: '🌟', isSecret: false },
  { code: 'SEVEN_DAY_VIBER', title: '۷ روز وایبر', description: '۷ روز متوالی فعالیت', category: 'consistency', tier: 'bronze', icon: '📅', isSecret: false },
  { code: 'MONTHLY_CREATOR', title: 'Monthly Creator', description: '۱۰ فعالیت در یک ماه', category: 'consistency', tier: 'silver', icon: '📆', isSecret: false },
  { code: 'COMEBACK_CURATOR', title: 'Comeback Curator', description: 'بازگشت فعال پس از ۳۰ روز', category: 'consistency', tier: 'bronze', icon: '🔄', isSecret: false },
] as const;

export type AchievementCode = (typeof ACHIEVEMENT_DEFINITIONS)[number]['code'];

/** Ensure all achievement rows exist in DB */
export async function ensureAchievements(prisma: PrismaClient) {
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievements.upsert({
      where: { code: def.code },
      create: {
        code: def.code,
        title: def.title,
        description: def.description,
        category: def.category,
        tier: def.tier,
        icon: def.icon,
        isSecret: def.isSecret,
      },
      update: {
        title: def.title,
        description: def.description,
        category: def.category,
        tier: def.tier,
        icon: def.icon,
        isSecret: def.isSecret,
      },
    });
  }
}

export interface AchievementUnlockResult {
  newlyUnlocked: { code: string; title: string; icon: string; tier: string }[];
}

/**
 * Evaluate all achievement conditions for a user and unlock any newly earned.
 * Call after: list create, list save milestone, suggestion approved, helpful vote, etc.
 */
export async function checkAchievements(
  prisma: PrismaClient,
  userId: string
): Promise<AchievementUnlockResult> {
  await ensureAchievements(prisma);

  const [achievements, unlockedIds, userLists, listStats, helpfulTotal, approvedSuggestions, totalLikes, bookmarksByDay, commentsByDay, suggestionsByDay] = await Promise.all([
    prisma.achievements.findMany({ select: { id: true, code: true, title: true, icon: true, tier: true } }),
    prisma.user_achievements.findMany({ where: { userId }, select: { achievementId: true } }).then((r) => new Set(r.map((x) => x.achievementId))),
    prisma.lists.findMany({
      where: { userId, isActive: true, isPublic: true },
      select: { id: true, likeCount: true, saveCount: true, createdAt: true },
    }),
    prisma.lists.aggregate({
      where: { userId, isActive: true, isPublic: true },
      _count: { id: true },
      _avg: { saveCount: true },
    }),
    prisma.list_comments.aggregate({
      where: { userId, deletedAt: null },
      _sum: { helpfulUp: true },
    }),
    prisma.suggested_items.count({ where: { userId, status: 'approved' } }),
    prisma.lists.aggregate({
      where: { userId, isActive: true, isPublic: true },
      _sum: { likeCount: true },
    }),
    prisma.bookmarks.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.list_comments.findMany({ where: { userId, deletedAt: null }, select: { createdAt: true } }),
    prisma.suggested_items.findMany({ where: { userId }, select: { createdAt: true } }),
  ]);

  const publicCount = listStats._count.id;
  const avgSaves = listStats._avg.saveCount ?? 0;
  const viralCount = userLists.filter((l) => (l.likeCount ?? 0) >= VIRAL_LIKE_THRESHOLD).length;
  const maxSaves = userLists.length ? Math.max(...userLists.map((l) => l.saveCount ?? 0)) : 0;
  const helpfulVotes = helpfulTotal._sum.helpfulUp ?? 0;
  const totalLikesSum = totalLikes._sum.likeCount ?? 0;

  const allActivityDates = new Set<string>();
  [...bookmarksByDay, ...commentsByDay, ...suggestionsByDay].forEach((x) => {
    allActivityDates.add(new Date(x.createdAt).toISOString().slice(0, 10));
  });
  userLists.forEach((l) => allActivityDates.add(new Date(l.createdAt).toISOString().slice(0, 10)));
  const sortedDates = Array.from(allActivityDates).sort();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const last30Days = sortedDates.filter((d) => d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const last7Days = sortedDates.filter((d) => d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  let hasConsecutive7 = false;
  for (let i = 0; i <= sortedDates.length - 7; i++) {
    const slice = sortedDates.slice(i, i + 7);
    const expected = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(slice[0]);
      d.setDate(d.getDate() + j);
      return d.toISOString().slice(0, 10);
    });
    if (slice.every((s, j) => s === expected[j])) {
      hasConsecutive7 = true;
      break;
    }
  }
  const actionsLast30 = last30Days.length;
  const hadGap30 = sortedDates.length >= 2 && (new Date(sortedDates[sortedDates.length - 1]).getTime() - new Date(sortedDates[sortedDates.length - 2]).getTime()) / (24 * 60 * 60 * 1000) >= 30;
  const hasComeback = hadGap30 && last7Days.length > 0;

  const conditions: Record<string, boolean> = {
    FIRST_VIBE: publicCount >= 1,
    FIVE_LISTS: publicCount >= 5,
    TWENTY_LISTS: publicCount >= 20,
    MASTER_CURATOR: publicCount >= 50 && avgSaves >= 3,
    VIRAL_SPARK: viralCount >= 1,
    TREND_MAKER: viralCount >= 3,
    SAVES_100: maxSaves >= 100,
    SAVES_500: maxSaves >= 500,
    HELPFUL_VOICE: helpfulVotes >= 10,
    INSIGHTFUL_CURATOR: approvedSuggestions >= 5,
    COMMUNITY_FAVORITE: totalLikesSum >= 100,
    SEVEN_DAY_VIBER: hasConsecutive7,
    MONTHLY_CREATOR: actionsLast30 >= 10,
    COMEBACK_CURATOR: hasComeback,
  };

  const codeToAchievement = new Map(achievements.map((a) => [a.code, a]));
  const newlyUnlocked: { code: string; title: string; icon: string; tier: string }[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const ach = codeToAchievement.get(def.code);
    if (!ach || unlockedIds.has(ach.id)) continue;
    if (!conditions[def.code]) continue;

    await prisma.user_achievements.create({
      data: { userId, achievementId: ach.id },
    });
    newlyUnlocked.push({ code: ach.code, title: ach.title, icon: ach.icon, tier: ach.tier });
    unlockedIds.add(ach.id);
  }

  return { newlyUnlocked };
}
