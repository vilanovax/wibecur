import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { ensureAchievements, checkAchievements } from '@/lib/achievements';
import { tryApiDbFallback } from '@/lib/api-db';

const EMPTY = { achievements: [], newlyUnlocked: [] };

/** GET /api/user/achievements */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    await dbQuery(() => ensureAchievements(prisma));
    const { newlyUnlocked } = await dbQuery(() => checkAchievements(prisma, userId));

    const [achievements, unlocked] = await dbQuery(() =>
      Promise.all([
        prisma.achievements.findMany({
          orderBy: [{ category: 'asc' }, { tier: 'asc' }],
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            category: true,
            tier: true,
            icon: true,
            isSecret: true,
          },
        }),
        prisma.user_achievements.findMany({
          where: { userId },
          select: { achievementId: true, unlockedAt: true },
        }),
      ])
    );

    const unlockedSet = new Set(unlocked.map((u) => u.achievementId));
    const unlockedAtMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

    const list = achievements.map((a) => ({
      id: a.id,
      code: a.code,
      title: a.title,
      description: a.description,
      category: a.category,
      tier: a.tier,
      icon: a.icon,
      isSecret: a.isSecret,
      unlocked: unlockedSet.has(a.id),
      unlockedAt: unlockedAtMap.get(a.id) ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: { achievements: list, newlyUnlocked },
    });
  } catch (error: unknown) {
    const fb = tryApiDbFallback(error, EMPTY, 'User achievements');
    if (fb) return fb;
    console.error('User achievements error:', error);
    return NextResponse.json({ success: true, data: EMPTY });
  }
}
