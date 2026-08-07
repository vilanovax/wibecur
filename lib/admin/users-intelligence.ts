/**
 * User Intelligence — داده پنل مدیریت کاربران (فیلتر/مرتب‌سازی سرور، رشد ۷ روزه)
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { computeSaveGrowthPercent } from '@/lib/admin/category-intelligence';
import { botExclusionWhere, isBotUser } from '@/lib/admin/user-bot-utils';
import type { UserFilterKind } from '@/lib/admin/user-filter-utils';
import { USER_FILTER_PILLS } from '@/lib/admin/user-filter-utils';
import type {
  UserIntelligenceRow,
  UserPulseSummary,
} from '@/lib/admin/users-types';
import { getUsersCommentModerationMeta } from '@/lib/comment-permission';

export const USERS_PAGE_SIZE = 20;
const MS_DAY = 24 * 60 * 60 * 1000;

export type UserSortKind =
  | 'created_desc'
  | 'created_asc'
  | 'growth_desc'
  | 'growth_asc'
  | 'bookmarks_desc'
  | 'lists_desc'
  | 'curator_desc';

export const USER_SORT_OPTIONS: { value: UserSortKind; label: string }[] = [
  { value: 'created_desc', label: 'جدیدترین عضویت' },
  { value: 'created_asc', label: 'قدیمی‌ترین عضویت' },
  { value: 'growth_desc', label: 'بیشترین رشد ۷ روزه' },
  { value: 'growth_asc', label: 'کمترین رشد ۷ روزه' },
  { value: 'bookmarks_desc', label: 'بیشترین ذخیره' },
  { value: 'lists_desc', label: 'بیشترین لیست' },
  { value: 'curator_desc', label: 'امتیاز کیوریتور' },
];

export type UsersIntelligenceQuery = {
  page: number;
  search: string;
  filter: UserFilterKind;
  hideBots: boolean;
  sort: UserSortKind;
  trash?: boolean;
};

export type UsersIntelligenceData = {
  pulse: UserPulseSummary;
  users: UserIntelligenceRow[];
  filterCounts: Record<UserFilterKind, number>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  filter: UserFilterKind;
  sort: UserSortKind;
  search: string;
  hideBots: boolean;
};

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

export function parseUserSort(value: string | undefined): UserSortKind {
  const valid = new Set(USER_SORT_OPTIONS.map((o) => o.value));
  if (value && valid.has(value as UserSortKind)) return value as UserSortKind;
  return 'created_desc';
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

function filterWhereClause(filter: UserFilterKind): Prisma.usersWhereInput | null {
  const thirtyDaysAgo = new Date(Date.now() - 30 * MS_DAY);

  switch (filter) {
    case 'most_active':
      // resolved via mostActiveIds (groupBy)
      return null;
    case 'growing':
      // resolved via growingIds
      return null;
    case 'curators':
      return {
        OR: [{ curatorLevel: { not: 'EXPLORER' } }, { curatorScore: { gt: 0 } }],
      };
    case 'suspicious':
      return {
        OR: [{ user_violations: { some: {} } }, { comment_reports: { some: {} } }],
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

async function fetchBookmarkGrowthMaps(
  userIds: string[],
  last7d: Date,
  last14d: Date
): Promise<Map<string, ActivityGrowth>> {
  if (userIds.length === 0) return new Map();

  const [bookRecent, bookPrev, listRecent, listPrev] = await Promise.all([
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, createdAt: { gte: last7d } },
        _count: { _all: true },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          createdAt: { gte: last14d, lt: last7d },
        },
        _count: { _all: true },
      })
    ),
    dbQuery(() =>
      prisma.lists.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, createdAt: { gte: last7d } },
        _count: { _all: true },
      })
    ),
    dbQuery(() =>
      prisma.lists.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          createdAt: { gte: last14d, lt: last7d },
        },
        _count: { _all: true },
      })
    ),
  ]);

  const map = new Map<string, { recent: number; previous: number }>();

  const bump = (userId: string, field: 'recent' | 'previous', n: number) => {
    const cur = map.get(userId) ?? { recent: 0, previous: 0 };
    cur[field] += n;
    map.set(userId, cur);
  };

  for (const row of bookRecent) bump(row.userId, 'recent', row._count._all);
  for (const row of bookPrev) bump(row.userId, 'previous', row._count._all);
  for (const row of listRecent) bump(row.userId, 'recent', row._count._all);
  for (const row of listPrev) bump(row.userId, 'previous', row._count._all);

  const out = new Map<string, ActivityGrowth>();
  for (const [userId, { recent, previous }] of map) {
    out.set(userId, {
      recent,
      previous,
      percent: computeSaveGrowthPercent(recent, previous),
    });
  }
  return out;
}

/** ≥۲ لیست یا ≥۵ بوکمارک */
async function fetchMostActiveUserIds(
  baseWhere: Prisma.usersWhereInput
): Promise<string[]> {
  const baseUsers = await dbQuery(() =>
    prisma.users.findMany({ where: baseWhere, select: { id: true } })
  );
  const baseIds = new Set(baseUsers.map((u) => u.id));
  if (baseIds.size === 0) return [];

  const [listAgg, bookAgg] = await Promise.all([
    dbQuery(() =>
      prisma.lists.groupBy({
        by: ['userId'],
        _count: { _all: true },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['userId'],
        _count: { _all: true },
      })
    ),
  ]);

  const active = new Set<string>();
  for (const row of listAgg) {
    if (baseIds.has(row.userId) && row._count._all >= 2) active.add(row.userId);
  }
  for (const row of bookAgg) {
    if (baseIds.has(row.userId) && row._count._all >= 5) active.add(row.userId);
  }
  return [...active];
}

/** شناسه کاربران با رشد فعالیت ۷ روزه (بوکمارک + لیست جدید) */
async function fetchGrowingUserIds(baseWhere: Prisma.usersWhereInput): Promise<string[]> {
  const last7d = new Date(Date.now() - 7 * MS_DAY);
  const last14d = new Date(Date.now() - 14 * MS_DAY);

  const baseUsers = await dbQuery(() =>
    prisma.users.findMany({
      where: baseWhere,
      select: { id: true },
    })
  );
  const baseIds = new Set(baseUsers.map((u) => u.id));
  if (baseIds.size === 0) return [];

  const [bookRecent, bookPrev, listRecent, listPrev] = await Promise.all([
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: last7d } },
        _count: { _all: true },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: last14d, lt: last7d } },
        _count: { _all: true },
      })
    ),
    dbQuery(() =>
      prisma.lists.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: last7d } },
        _count: { _all: true },
      })
    ),
    dbQuery(() =>
      prisma.lists.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: last14d, lt: last7d } },
        _count: { _all: true },
      })
    ),
  ]);

  const activity = new Map<string, { recent: number; previous: number }>();
  const add = (rows: { userId: string; _count: { _all: number } }[], field: 'recent' | 'previous') => {
    for (const row of rows) {
      if (!baseIds.has(row.userId)) continue;
      const cur = activity.get(row.userId) ?? { recent: 0, previous: 0 };
      cur[field] += row._count._all;
      activity.set(row.userId, cur);
    }
  };

  add(bookRecent, 'recent');
  add(bookPrev, 'previous');
  add(listRecent, 'recent');
  add(listPrev, 'previous');

  const growing: string[] = [];
  for (const [userId, counts] of activity) {
    const percent = computeSaveGrowthPercent(counts.recent, counts.previous);
    if (percent > 0 || (counts.recent > 0 && counts.previous === 0)) {
      growing.push(userId);
    }
  }
  return growing;
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
    avgSavesPerList: listsCount > 0 ? Math.round(bookmarksCount / listsCount) : 0,
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

function prismaOrderBy(sort: UserSortKind): Prisma.usersOrderByWithRelationInput {
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
    const ids = await dbQuery(() =>
      prisma.users.findMany({
        where,
        select: { id: true },
      })
    );
    if (ids.length === 0) return [];

    const growthMap = await fetchBookmarkGrowthMaps(
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
    users.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    const pageGrowth = await fetchBookmarkGrowthMaps(sortedIds, last7d, last14d);
    const rows = users.map((u) => rowToIntelligence(u, pageGrowth.get(u.id)));
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

  const growthMap = await fetchBookmarkGrowthMaps(
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

  await Promise.all(
    USER_FILTER_PILLS.map(async (pill) => {
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
    highGrowthCount,
    curatorCandidatesCount,
    suspiciousCount,
  ] = await Promise.all([
    dbQuery(async () => {
      const rows = await prisma.bookmarks.findMany({
        where: {
          createdAt: { gte: last7d },
          users: baseWhere,
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      return rows.length;
    }),
    dbQuery(async () => {
      const rows = await prisma.bookmarks.findMany({
        where: {
          createdAt: { gte: last14d, lt: last7d },
          users: baseWhere,
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      return rows.length;
    }),
    Promise.resolve(growingIds.length),
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
            ((activeUserIds7d - prevPeriodActiveCount) / prevPeriodActiveCount) * 100
          )
        : undefined,
    highGrowthCount,
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
