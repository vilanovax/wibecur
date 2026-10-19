/**
 * User Intelligence — server data for admin users panel.
 *
 * Perf (vercel-react-best-practices):
 * - Growing / most-active via SQL (no full-table JS groupBy + all user ids)
 * - Bookmark+list growth windows in one SQL
 * - Growth sort: one scored query, no double growth fetch
 * - Types/sort UI constants live in users-types.ts (client-safe)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { computeSaveGrowthPercent } from '@/lib/admin/category-intelligence-shared';
import { botExclusionWhere, isBotUser } from '@/lib/admin/user-bot-utils';
import type { UserFilterKind } from '@/lib/admin/user-filter-utils';
import { USER_FILTER_PILLS } from '@/lib/admin/user-filter-utils';
import type {
  UserIntelligenceRow,
  UserPulseSummary,
  UserSortKind,
  UsersIntelligenceData,
  UsersIntelligenceQuery,
} from '@/lib/admin/users-types';
import { getUsersCommentModerationMeta } from '@/lib/comment-permission';

export type {
  UserSortKind,
  UsersIntelligenceQuery,
  UsersIntelligenceData,
} from '@/lib/admin/users-types';
export {
  USER_SORT_OPTIONS,
  parseUserSort,
} from '@/lib/admin/users-types';

export const USERS_PAGE_SIZE = 20;
const MS_DAY = 24 * 60 * 60 * 1000;

const userSelect = {
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
} as const;

type UserRow = Awaited<
  ReturnType<typeof prisma.users.findMany<{ select: typeof userSelect }>>
>[number];

function deriveQuality(
  listsCount: number,
  bookmarksCount: number,
  curatorScore: number
): UserIntelligenceRow['quality'] {
  if (curatorScore > 5 || (listsCount >= 3 && bookmarksCount >= 10))
    return 'high_impact';
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

export function buildBaseUsersWhere(query: {
  search: string;
  hideBots: boolean;
  trash?: boolean;
}): Prisma.usersWhereInput {
  if (query.trash) return { id: '' };

  const parts: Prisma.usersWhereInput[] = [];
  if (query.hideBots) parts.push(botExclusionWhere());
  if (query.search.trim()) {
    const q = query.search.trim();
    parts.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

function filterWhereClause(
  filter: UserFilterKind
): Prisma.usersWhereInput | null {
  const thirtyDaysAgo = new Date(Date.now() - 30 * MS_DAY);

  switch (filter) {
    case 'most_active':
    case 'growing':
      return null;
    case 'curators':
      return {
        OR: [
          { curatorLevel: { not: 'EXPLORER' } },
          { curatorScore: { gt: 0 } },
        ],
      };
    case 'suspicious':
      return {
        OR: [
          { user_violations: { some: {} } },
          { comment_reports: { some: {} } },
        ],
      };
    case 'new':
      return { createdAt: { gte: thirtyDaysAgo } };
    default:
      return null;
  }
}

export function mergeUsersWhere(
  base: Prisma.usersWhereInput,
  filter: UserFilterKind,
  idSets?: { growingIds?: string[]; mostActiveIds?: string[] }
): Prisma.usersWhereInput {
  if (filter === 'all') return base;

  if (filter === 'growing') {
    const ids = idSets?.growingIds ?? [];
    if (ids.length === 0) return { AND: [base, { id: { in: [] } }] };
    return { AND: [base, { id: { in: ids } }] };
  }

  if (filter === 'most_active') {
    const ids = idSets?.mostActiveIds ?? [];
    if (ids.length === 0) return { AND: [base, { id: { in: [] } }] };
    return { AND: [base, { id: { in: ids } }] };
  }

  const extra = filterWhereClause(filter);
  if (!extra) return base;
  return { AND: [base, extra] };
}

type ActivityGrowth = { recent: number; previous: number; percent: number };

/** One SQL for bookmark+list activity windows (replaces 4× groupBy) */
async function fetchActivityGrowthMaps(
  userIds: string[],
  last7d: Date,
  last14d: Date
): Promise<Map<string, ActivityGrowth>> {
  const out = new Map<string, ActivityGrowth>();
  if (userIds.length === 0) return out;

  const rows = await dbQuery(() =>
    prisma.$queryRaw<{ userId: string; recent: number; previous: number }[]>(
      Prisma.sql`
        SELECT t."userId" AS "userId",
               SUM(t.recent)::int AS recent,
               SUM(t.previous)::int AS previous
        FROM (
          SELECT b."userId" AS "userId",
                 COUNT(*) FILTER (WHERE b."createdAt" >= ${last7d})::int AS recent,
                 COUNT(*) FILTER (
                   WHERE b."createdAt" >= ${last14d} AND b."createdAt" < ${last7d}
                 )::int AS previous
          FROM bookmarks b
          WHERE b."userId" IN (${Prisma.join(userIds)})
            AND b."createdAt" >= ${last14d}
          GROUP BY b."userId"
          UNION ALL
          SELECT l."userId" AS "userId",
                 COUNT(*) FILTER (WHERE l."createdAt" >= ${last7d})::int AS recent,
                 COUNT(*) FILTER (
                   WHERE l."createdAt" >= ${last14d} AND l."createdAt" < ${last7d}
                 )::int AS previous
          FROM lists l
          WHERE l."userId" IN (${Prisma.join(userIds)})
            AND l."createdAt" >= ${last14d}
          GROUP BY l."userId"
        ) t
        GROUP BY t."userId"
      `
    )
  );

  for (const row of rows) {
    out.set(row.userId, {
      recent: row.recent,
      previous: row.previous,
      percent: computeSaveGrowthPercent(row.recent, row.previous),
    });
  }
  return out;
}

/**
 * Most-active: ≥2 lists OR ≥5 bookmarks — SQL union (no load-all-user-ids).
 * Then intersect with baseWhere via Prisma.
 */
async function fetchMostActiveUserIds(
  baseWhere: Prisma.usersWhereInput
): Promise<string[]> {
  const candidateRows = await dbQuery(() =>
    prisma.$queryRaw<{ userId: string }[]>(Prisma.sql`
      SELECT "userId" FROM (
        SELECT "userId" FROM lists GROUP BY "userId" HAVING COUNT(*) >= 2
        UNION
        SELECT "userId" FROM bookmarks GROUP BY "userId" HAVING COUNT(*) >= 5
      ) t
    `)
  );
  const candidateIds = candidateRows.map((r) => r.userId);
  if (candidateIds.length === 0) return [];

  const matched = await dbQuery(() =>
    prisma.users.findMany({
      where: { AND: [baseWhere, { id: { in: candidateIds } }] },
      select: { id: true },
    })
  );
  return matched.map((u) => u.id);
}

/**
 * Growing: recent activity (7d) > previous window — scoped to last 14d only.
 */
async function fetchGrowingUserIds(
  baseWhere: Prisma.usersWhereInput
): Promise<string[]> {
  const last7d = new Date(Date.now() - 7 * MS_DAY);
  const last14d = new Date(Date.now() - 14 * MS_DAY);

  const rows = await dbQuery(() =>
    prisma.$queryRaw<{ userId: string; recent: number; previous: number }[]>(
      Prisma.sql`
        SELECT t."userId" AS "userId",
               SUM(t.recent)::int AS recent,
               SUM(t.previous)::int AS previous
        FROM (
          SELECT b."userId" AS "userId",
                 COUNT(*) FILTER (WHERE b."createdAt" >= ${last7d})::int AS recent,
                 COUNT(*) FILTER (
                   WHERE b."createdAt" >= ${last14d} AND b."createdAt" < ${last7d}
                 )::int AS previous
          FROM bookmarks b
          WHERE b."createdAt" >= ${last14d}
          GROUP BY b."userId"
          UNION ALL
          SELECT l."userId" AS "userId",
                 COUNT(*) FILTER (WHERE l."createdAt" >= ${last7d})::int AS recent,
                 COUNT(*) FILTER (
                   WHERE l."createdAt" >= ${last14d} AND l."createdAt" < ${last7d}
                 )::int AS previous
          FROM lists l
          WHERE l."createdAt" >= ${last14d}
          GROUP BY l."userId"
        ) t
        GROUP BY t."userId"
        HAVING SUM(t.recent) > SUM(t.previous)
      `
    )
  );

  const growingIds = rows.map((r) => r.userId);
  if (growingIds.length === 0) return [];

  const matched = await dbQuery(() =>
    prisma.users.findMany({
      where: { AND: [baseWhere, { id: { in: growingIds } }] },
      select: { id: true },
    })
  );
  return matched.map((u) => u.id);
}

function rowToIntelligence(
  u: UserRow,
  growth: ActivityGrowth | undefined
): UserIntelligenceRow {
  const listsCount = u._count.lists;
  const bookmarksCount = u._count.bookmarks;
  const { risk, riskLabel } = deriveRisk(
    u._count.user_violations,
    u._count.comment_reports
  );
  const quality = deriveQuality(listsCount, bookmarksCount, u.curatorScore);
  const g = growth ?? { recent: 0, previous: 0, percent: 0 };

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
    growthPercent: g.percent,
    growth7dRecent: g.recent,
    growth7dPrevious: g.previous,
    risk,
    riskLabel,
    avgSavesPerList:
      listsCount > 0 ? Math.round(bookmarksCount / listsCount) : 0,
    userViolationsCount: u._count.user_violations,
    commentReportsCount: u._count.comment_reports,
    curatorScore: u.curatorScore,
    curatorLevel: u.curatorLevel,
    isBot: isBotUser({ email: u.email, name: u.name }),
  };
}

async function enrichRowsWithCommentStatus(
  rows: UserIntelligenceRow[]
): Promise<UserIntelligenceRow[]> {
  if (rows.length === 0) return rows;
  const meta = await getUsersCommentModerationMeta(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...row,
    commentStatus: meta.get(row.id)?.status ?? 'allowed',
  }));
}

function prismaOrderBy(
  sort: UserSortKind
): Prisma.usersOrderByWithRelationInput {
  switch (sort) {
    case 'created_asc':
      return { createdAt: 'asc' };
    case 'curator_desc':
      return { curatorScore: 'desc' };
    case 'bookmarks_desc':
      return { bookmarks: { _count: 'desc' } };
    case 'lists_desc':
      return { lists: { _count: 'desc' } };
    case 'created_desc':
    default:
      return { createdAt: 'desc' };
  }
}

async function fetchPageUsers(
  where: Prisma.usersWhereInput,
  sort: UserSortKind,
  skip: number,
  take: number
): Promise<UserIntelligenceRow[]> {
  const last7d = new Date(Date.now() - 7 * MS_DAY);
  const last14d = new Date(Date.now() - 14 * MS_DAY);

  if (sort === 'growth_desc' || sort === 'growth_asc') {
    // Score only users matching where — growth from 14d activity SQL, then page slice
    const ids = await dbQuery(() =>
      prisma.users.findMany({ where, select: { id: true } })
    );
    if (ids.length === 0) return [];

    const growthMap = await fetchActivityGrowthMaps(
      ids.map((i) => i.id),
      last7d,
      last14d
    );

    const sortedIds = [...ids]
      .sort((a, b) => {
        const ga = growthMap.get(a.id)?.percent ?? 0;
        const gb = growthMap.get(b.id)?.percent ?? 0;
        return sort === 'growth_desc' ? gb - ga : ga - gb;
      })
      .slice(skip, skip + take)
      .map((i) => i.id);

    if (sortedIds.length === 0) return [];

    const users = await dbQuery(() =>
      prisma.users.findMany({
        where: { id: { in: sortedIds } },
        select: userSelect,
      })
    );
    const orderMap = new Map(sortedIds.map((id, idx) => [id, idx]));
    users.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    );

    // Reuse growthMap — no second fetch
    const rows = users.map((u) => rowToIntelligence(u, growthMap.get(u.id)));
    return enrichRowsWithCommentStatus(rows);
  }

  const users = await dbQuery(() =>
    prisma.users.findMany({
      where,
      skip,
      take,
      orderBy: prismaOrderBy(sort),
      select: userSelect,
    })
  );

  const growthMap = await fetchActivityGrowthMaps(
    users.map((u) => u.id),
    last7d,
    last14d
  );
  const rows = users.map((u) => rowToIntelligence(u, growthMap.get(u.id)));
  return enrichRowsWithCommentStatus(rows);
}

async function fetchFilterCounts(
  baseWhere: Prisma.usersWhereInput,
  idSets: { growingIds: string[]; mostActiveIds: string[] }
): Promise<Record<UserFilterKind, number>> {
  const counts = {} as Record<UserFilterKind, number>;

  // Cheap: most_active / growing from id set sizes after base intersect (already done)
  // Still need count for each pill under baseWhere — parallel counts
  await Promise.all(
    USER_FILTER_PILLS.map(async (pill) => {
      if (pill.value === 'growing') {
        counts.growing = idSets.growingIds.length;
        return;
      }
      if (pill.value === 'most_active') {
        counts.most_active = idSets.mostActiveIds.length;
        return;
      }
      const where = mergeUsersWhere(baseWhere, pill.value, idSets);
      counts[pill.value] = await dbQuery(() => prisma.users.count({ where }));
    })
  );

  return counts;
}

async function fetchPulse(
  baseWhere: Prisma.usersWhereInput,
  growingIds: string[]
): Promise<UserPulseSummary> {
  const last7d = new Date(Date.now() - 7 * MS_DAY);
  const last14d = new Date(Date.now() - 14 * MS_DAY);

  const [
    activeUserIds7d,
    prevPeriodActiveCount,
    curatorCandidatesCount,
    suspiciousCount,
  ] = await Promise.all([
    dbQuery(async () => {
      // COUNT(DISTINCT) via groupBy — avoids loading every bookmark row
      const rows = await prisma.bookmarks.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: last7d },
          users: baseWhere,
        },
      });
      return rows.length;
    }),
    dbQuery(async () => {
      const rows = await prisma.bookmarks.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: last14d, lt: last7d },
          users: baseWhere,
        },
      });
      return rows.length;
    }),
    dbQuery(() =>
      prisma.users.count({
        where: mergeUsersWhere(baseWhere, 'curators', {}),
      })
    ),
    dbQuery(() =>
      prisma.users.count({
        where: mergeUsersWhere(baseWhere, 'suspicious', {}),
      })
    ),
  ]);

  return {
    activeUsers7d: activeUserIds7d,
    activeUsers7dDelta:
      prevPeriodActiveCount > 0
        ? Math.round(
            ((activeUserIds7d - prevPeriodActiveCount) /
              prevPeriodActiveCount) *
              100
          )
        : undefined,
    highGrowthCount: growingIds.length,
    curatorCandidatesCount,
    suspiciousCount,
  };
}

export async function getUsersIntelligenceData(
  query: UsersIntelligenceQuery
): Promise<UsersIntelligenceData> {
  const page = Math.max(1, query.page);
  const skip = (page - 1) * USERS_PAGE_SIZE;
  const baseWhere = buildBaseUsersWhere(query);

  const [growingIds, mostActiveIds] = await Promise.all([
    fetchGrowingUserIds(baseWhere),
    fetchMostActiveUserIds(baseWhere),
  ]);

  const idSets = { growingIds, mostActiveIds };
  const listWhere = mergeUsersWhere(baseWhere, query.filter, idSets);

  const [totalCount, users, filterCounts, pulse] = await Promise.all([
    dbQuery(() => prisma.users.count({ where: listWhere })),
    fetchPageUsers(listWhere, query.sort, skip, USERS_PAGE_SIZE),
    fetchFilterCounts(baseWhere, idSets),
    fetchPulse(baseWhere, growingIds),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / USERS_PAGE_SIZE));

  return {
    pulse,
    users,
    filterCounts,
    currentPage: page,
    pageSize: USERS_PAGE_SIZE,
    totalPages,
    totalCount,
    filter: query.filter,
    sort: query.sort,
    search: query.search,
    hideBots: query.hideBots,
  };
}
