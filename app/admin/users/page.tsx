import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import Pagination from '@/components/admin/shared/Pagination';
import UsersPageClient from './UsersPageClient';
import type { UserPulseSummary, UserIntelligenceRow } from '@/lib/admin/users-types';

const ITEMS_PER_PAGE = 20;

function deriveQuality(
  listsCount: number,
  bookmarksCount: number,
  curatorScore: number
): UserIntelligenceRow['quality'] {
  if (curatorScore > 5 || (listsCount >= 3 && bookmarksCount >= 10)) return 'high_impact';
  if (listsCount >= 1 || bookmarksCount >= 2) return 'stable';
  return 'low_engagement';
}

function deriveRisk(
  userViolations: number,
  commentReports: number
): { risk: UserIntelligenceRow['risk']; riskLabel?: string } {
  if (userViolations > 2 || commentReports > 1)
    return { risk: 'bot_risk', riskLabel: 'ریسک بالا' };
  if (userViolations > 0 || commentReports > 0)
    return { risk: 'spike', riskLabel: 'نیاز به بررسی' };
  return { risk: 'clean' };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; trash?: string }>;
}) {
  await requireAdmin();

  const { page = '1', search = '', trash: trashParam = '' } = await searchParams;
  const trash = trashParam === 'true';
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Avoid deletedAt filter when column does not exist in DB
  const where: Record<string, unknown> = trash ? { id: '' } : {};
  if (search && !trash) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
    ];
  }

  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalCount,
    users,
    activeUserIds7d,
    prevPeriodActiveCount,
  ] = await Promise.all([
    dbQuery(() => prisma.users.count({ where })),
    dbQuery(() =>
      prisma.users.findMany({
        skip,
        take: ITEMS_PER_PAGE,
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          curatorScore: true,
          curatorLevel: true,
          _count: {
            select: {
              lists: true,
              list_likes: true,
              bookmarks: true,
              user_violations: true,
              comment_reports: true,
            },
          },
        },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.findMany({
        where: { createdAt: { gte: last7d } },
        select: { userId: true },
        distinct: ['userId'],
      })
    ).then((r) => r.length),
    dbQuery(() =>
      prisma.bookmarks.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            lt: last7d,
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      })
    ).then((r) => r.length),
  ]);

  const [highGrowthCount, curatorCandidatesCount, suspiciousCount] =
    await Promise.all([
      dbQuery(() =>
        prisma.users.count({
          where: { curatorScore: { gt: 0 } },
        })
      ),
      dbQuery(() =>
        prisma.users.count({
          where: {
            OR: [
              { curatorLevel: { not: 'EXPLORER' } },
              { curatorScore: { gt: 3 } },
            ],
          },
        })
      ),
      dbQuery(() =>
        prisma.users.count({
          where: {
            OR: [
              { user_violations: { some: {} } },
              { comment_reports: { some: {} } },
            ],
          },
        })
      ),
    ]);

  const pulse: UserPulseSummary = {
    activeUsers7d: activeUserIds7d,
    activeUsers7dDelta:
      prevPeriodActiveCount > 0
        ? Math.round(((activeUserIds7d - prevPeriodActiveCount) / prevPeriodActiveCount) * 100)
        : undefined,
    highGrowthCount,
    curatorCandidatesCount,
    suspiciousCount,
  };

  const intelligenceRows: UserIntelligenceRow[] = users.map((u) => {
    const listsCount = u._count.lists;
    const bookmarksCount = u._count.bookmarks;
    const { risk, riskLabel } = deriveRisk(
      u._count.user_violations,
      u._count.comment_reports
    );
    const quality = deriveQuality(
      listsCount,
      bookmarksCount,
      u.curatorScore
    );
    const growthPercent =
      listsCount + bookmarksCount > 0
        ? Math.min(99, Math.round((u.curatorScore + listsCount) / 2))
        : 0;
    const avgSavesPerList =
      listsCount > 0 ? Math.round(bookmarksCount / listsCount) : 0;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      listsCount,
      bookmarksCount,
      listLikesCount: u._count.list_likes,
      quality,
      growthPercent,
      risk,
      riskLabel,
      avgSavesPerList,
      userViolationsCount: u._count.user_violations,
      commentReportsCount: u._count.comment_reports,
      curatorScore: u.curatorScore,
      curatorLevel: u.curatorLevel,
    };
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <UsersPageClient
      pulse={pulse}
      users={intelligenceRows}
      currentSearch={search}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
