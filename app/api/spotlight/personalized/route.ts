import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import {
  getSpotlightCreator,
  computeAndUpsertUserCategoryAffinity,
  SPOTLIGHT_CACHE_HOURS,
} from '@/lib/discovery';

/** GET /api/spotlight/personalized — پیشنهاد ویژه یک کیوریتور برای کاربر (با کش ۲۴ ساعته) */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const cacheMaxAgeMs = SPOTLIGHT_CACHE_HOURS * 60 * 60 * 1000;

    const cached = await prisma.discovery_spotlight_cache.findUnique({
      where: { userId },
      select: { creatorId: true, explanation: true, updatedAt: true },
    });

    if (cached && Date.now() - cached.updatedAt.getTime() < cacheMaxAgeMs) {
      const creatorId = cached.creatorId;
      const [u, lists, stats, viral] = await Promise.all([
        prisma.users.findUnique({
          where: { id: creatorId },
          select: { id: true, name: true, username: true, image: true, curatorLevel: true, avatarType: true, avatarId: true },
        }),
        prisma.lists.findMany({
          where: { userId: creatorId, isPublic: true, isActive: true },
          select: { categories: { select: { slug: true, name: true, icon: true } } },
        }),
        prisma.lists.groupBy({
          by: ['userId'],
          where: { userId: creatorId, isPublic: true },
          _sum: { likeCount: true },
          _count: { id: true },
        }),
        prisma.lists.count({
          where: { userId: creatorId, isPublic: true, likeCount: { gte: 50 } },
        }),
      ]);
      if (u) {
        const catMap = new Map<string, { name: string; icon: string }>();
        lists.forEach((l) => {
          const c = l.categories;
          if (c && !catMap.has(c.slug)) catMap.set(c.slug, { name: c.name, icon: c.icon });
        });
        const topCategories = [...catMap.entries()].slice(0, 3).map(([slug, o]) => ({ slug, name: o.name, icon: o.icon }));
        const s = stats[0];
        return NextResponse.json({
          success: true,
          data: {
            creator: {
              userId: u.id,
              name: u.name,
              username: u.username,
              image: u.image,
              avatarType: u.avatarType,
              avatarId: u.avatarId,
              curatorLevel: u.curatorLevel ?? 'EXPLORER',
              topCategories,
              totalLikes: s?._sum.likeCount ?? 0,
              listCount: s?._count.id ?? 0,
              viralCount: viral,
            },
            explanation: cached.explanation,
          },
        });
      }
    }

    const hasAffinity = await prisma.user_category_affinity.count({ where: { userId } });
    if (hasAffinity === 0) {
      await computeAndUpsertUserCategoryAffinity(prisma, userId);
    }

    const result = await getSpotlightCreator(prisma, userId);
    if (!result) {
      return NextResponse.json({ success: true, data: null });
    }

    await prisma.discovery_spotlight_cache.upsert({
      where: { userId },
      create: { userId, creatorId: result.creator.userId, explanation: result.explanation },
      update: { creatorId: result.creator.userId, explanation: result.explanation },
    });

    return NextResponse.json({
      success: true,
      data: {
        creator: result.creator,
        explanation: result.explanation,
        isRisingFallback: result.isRisingFallback ?? false,
      },
    });
  } catch (e) {
    console.error('Spotlight personalized error:', e);
    return NextResponse.json({ success: true, data: null });
  }
}
