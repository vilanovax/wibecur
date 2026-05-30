import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

export type UserRankResponse = {
  rank: number | null;
  monthlyRank: number | null;
  rankChange: number | null;
  totalCurators: number;
  monthYear: string | null;
};

/** GET /api/user/rank — رتبهٔ فقط کاربر جاری (سبک، بدون fetch کل leaderboard) */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [ranking, totalCurators] = await Promise.all([
      dbQuery(() =>
        prisma.creator_rankings.findUnique({
          where: { userId },
          select: {
            globalRank: true,
            previousGlobalRank: true,
            monthlyRank: true,
            monthYear: true,
          },
        })
      ),
      dbQuery(() =>
        prisma.creator_rankings.count({
          where: { globalRank: { gte: 1 } },
        })
      ),
    ]);

    if (!ranking || ranking.globalRank < 1) {
      return NextResponse.json({
        success: true,
        data: {
          rank: null,
          monthlyRank: ranking?.monthlyRank ?? null,
          rankChange: null,
          totalCurators,
          monthYear: ranking?.monthYear ?? null,
        } satisfies UserRankResponse,
      });
    }

    const rankChange =
      ranking.previousGlobalRank != null
        ? ranking.previousGlobalRank - ranking.globalRank
        : null;

    return NextResponse.json({
      success: true,
      data: {
        rank: ranking.globalRank,
        monthlyRank: ranking.monthlyRank ?? null,
        rankChange,
        totalCurators,
        monthYear: ranking.monthYear ?? null,
      } satisfies UserRankResponse,
    });
  } catch (error: unknown) {
    console.error('User rank error:', error);
    return NextResponse.json({
      success: true,
      data: {
        rank: null,
        monthlyRank: null,
        rankChange: null,
        totalCurators: 0,
        monthYear: null,
      },
    });
  }
}
