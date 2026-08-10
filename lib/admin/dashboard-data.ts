/**
 * Admin Dashboard 3.0 – Server-side data fetcher
 *
 * Performance notes (vercel-react-best-practices):
 * - All independent DB work runs in one Promise.all (async-parallel)
 * - Aggregates combined to avoid sequential waterfalls
 * - Unused / below-fold queries removed (curators, userGrowth, duplicate topLists)
 * - Lean moderation snapshot skips violations hub
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getDashboardModerationSnapshot } from './dashboard-moderation';
import { getDashboardPeriod, type DashboardRange } from './dashboard-range';
import type {
  DashboardData,
  KpiItem,
  SystemPulseCard,
  TrendingRadarRow,
  CategoryIntelligenceCard,
  RiskItem,
  ActionQueueItem,
  ActivityEvent,
} from './types';

/** یک رویداد برای هر عنوان+نوع — جلوگیری از تکرار «لیست X» در جریان فعالیت */
function dedupeDashboardActivities(events: ActivityEvent[]): ActivityEvent[] {
  const byKey = new Map<string, ActivityEvent>();
  for (const event of events) {
    const dedupeKey =
      event.type === 'list_created' || event.type === 'item_added'
        ? `${event.type}:${(event.description ?? event.title).trim()}`
        : event.id;
    const prev = byKey.get(dedupeKey);
    if (!prev || event.timestamp > prev.timestamp) {
      byKey.set(dedupeKey, event);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

export async function getDashboardData(
  rangeInput: DashboardRange = 'today'
): Promise<DashboardData> {
  const {
    periodStart,
    prevPeriodStart,
    prevPeriodEnd,
    periodLabel,
    last7d,
    last24h,
  } = getDashboardPeriod(rangeInput);

  const prev7dStart = new Date(last7d.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    userCount,
    listCount,
    itemCount,
    periodUsers,
    prevPeriodUsers,
    periodLists,
    prevPeriodLists,
    periodBookmarks,
    prevPeriodBookmarks,
    commentsModeration,
    pendingSuggestedLists,
    recentSuggestedPreviews,
    recentCommentReports,
    recentItemReports,
    categoriesWithCount,
    recentLists,
    recentItems,
    listTotals,
    bookmarks24hByList,
    bookmarks7dByList,
    bookmarksPrev7dByList,
    trendingListsDb,
    activeLists7d,
  ] = await Promise.all([
    dbQuery(() => prisma.users.count()),
    dbQuery(() => prisma.lists.count({ where: { isActive: true } })),
    dbQuery(() => prisma.items.count({ where: { deletedAt: null } })),
    dbQuery(() =>
      prisma.users.count({ where: { createdAt: { gte: periodStart } } })
    ),
    dbQuery(() =>
      prisma.users.count({
        where: {
          createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
        },
      })
    ),
    dbQuery(() =>
      prisma.lists.count({ where: { createdAt: { gte: periodStart } } })
    ),
    dbQuery(() =>
      prisma.lists.count({
        where: {
          createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
        },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.count({ where: { createdAt: { gte: periodStart } } })
    ),
    dbQuery(() =>
      prisma.bookmarks.count({
        where: {
          createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
        },
      })
    ),
    getDashboardModerationSnapshot(),
    dbQuery(() =>
      prisma.suggested_lists.count({ where: { status: 'pending' } })
    ),
    dbQuery(() =>
      prisma.suggested_lists.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, createdAt: true },
      })
    ),
    dbQuery(() =>
      prisma.comment_reports.findMany({
        where: { resolved: false, comments: { deletedAt: null } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          comments: { select: { content: true } },
          users: { select: { name: true, email: true } },
        },
      })
    ),
    dbQuery(() =>
      prisma.item_reports.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: { select: { title: true } },
          users: { select: { name: true, email: true } },
        },
      })
    ),
    dbQuery(() =>
      prisma.categories.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          order: true,
          _count: { select: { lists: true } },
        },
        orderBy: { order: 'asc' },
      })
    ),
    dbQuery(() =>
      prisma.lists.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, createdAt: true },
      })
    ),
    dbQuery(() =>
      prisma.items.findMany({
        take: 2,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          lists: { select: { slug: true } },
          createdAt: true,
        },
      })
    ),
    // Combined aggregate — avoids sequential waterfall after Promise.all
    dbQuery(() =>
      prisma.lists.aggregate({
        where: { isActive: true },
        _sum: { viewCount: true, saveCount: true },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: last24h } },
        _count: true,
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: last7d } },
        _count: true,
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: prev7dStart, lt: last7d } },
        _count: true,
      })
    ),
    dbQuery(() =>
      prisma.lists.findMany({
        where: { isActive: true, isPublic: true },
        orderBy: { saveCount: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          slug: true,
          saveCount: true,
          viewCount: true,
          categoryId: true,
          categories: { select: { name: true, id: true } },
        },
      })
    ),
    dbQuery(() =>
      prisma.lists.count({
        where: {
          isActive: true,
          bookmarks: { some: { createdAt: { gte: last7d } } },
        },
      })
    ),
  ]);

  const totalViews = listTotals._sum.viewCount ?? 0;
  const totalSaves = listTotals._sum.saveCount ?? 0;
  const saveRate =
    totalViews > 0 ? ((totalSaves / totalViews) * 100).toFixed(1) : '۰';
  const pendingItemReports = commentsModeration.unresolvedItemReports;
  const pendingCommentReports = commentsModeration.unresolvedCommentReports;

  const delta = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

  const actionQueue: ActionQueueItem[] = [
    ...(commentsModeration.pending > 0
      ? [
          {
            id: 'action-comments-pending',
            label: 'کامنت در انتظار',
            count: commentsModeration.pending,
            href: '/admin/comments/all?filter=pending',
            severity: (commentsModeration.pending > 3 ? 'high' : 'medium') as
              | 'high'
              | 'medium',
          },
        ]
      : []),
    ...(pendingCommentReports > 0
      ? [
          {
            id: 'action-comment-reports',
            label: 'ریپورت کامنت',
            count: pendingCommentReports,
            href: '/admin/comments/reports?resolved=false',
            severity: (pendingCommentReports > 2 ? 'high' : 'medium') as
              | 'high'
              | 'medium',
          },
        ]
      : []),
    ...(pendingItemReports > 0
      ? [
          {
            id: 'action-item-reports',
            label: 'ریپورت آیتم',
            count: pendingItemReports,
            href: '/admin/comments/item-reports?resolved=false',
            severity: (pendingItemReports > 2 ? 'high' : 'medium') as
              | 'high'
              | 'medium',
          },
        ]
      : []),
    ...(pendingSuggestedLists > 0
      ? [
          {
            id: 'action-suggestions',
            label: 'پیشنهاد لیست',
            count: pendingSuggestedLists,
            href: '/admin/suggestions',
            severity: 'medium' as const,
          },
        ]
      : []),
  ];

  const suggestionPreviews = recentSuggestedPreviews.map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
  }));

  const usersDelta = delta(periodUsers, prevPeriodUsers);
  const listsDelta = delta(periodLists, prevPeriodLists);
  const savesDelta = delta(periodBookmarks, prevPeriodBookmarks);

  const contentOverview = {
    categories: categoriesWithCount.length,
    lists: listCount,
    items: itemCount,
    users: userCount,
    totalViews,
    totalSaves,
    saveRate: `${saveRate}٪`,
  };

  const periodSnapshot = {
    label: periodLabel,
    range: rangeInput,
    newUsers: periodUsers,
    newLists: periodLists,
    saves: periodBookmarks,
    usersDelta,
    listsDelta,
    savesDelta,
  };

  const kpis: KpiItem[] = [
    {
      label: `کاربران جدید (${periodLabel})`,
      value: periodUsers,
      delta: usersDelta,
      trend: periodUsers >= prevPeriodUsers ? 'up' : 'down',
    },
    {
      label: `لیست‌های جدید (${periodLabel})`,
      value: periodLists,
      delta: listsDelta,
      trend: periodLists >= prevPeriodLists ? 'up' : 'down',
    },
    {
      label: `ذخیره (${periodLabel})`,
      value: periodBookmarks,
      delta: savesDelta,
      trend: periodBookmarks >= prevPeriodBookmarks ? 'up' : 'down',
    },
  ];

  const totalListCount = categoriesWithCount.reduce(
    (sum, c) => sum + c._count.lists,
    0
  );

  // Derive top lists from trending query — removes duplicate findMany
  const topLists = trendingListsDb.slice(0, 5).map((l) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    category: l.categories?.name ?? '—',
    saveCount: l.saveCount,
    viewCount: l.viewCount,
    isTrending: l.saveCount > 100,
  }));

  const topCategories = categoriesWithCount.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    listCount: c._count.lists,
    sharePercent:
      totalListCount > 0
        ? Math.round((c._count.lists / totalListCount) * 100)
        : 0,
    delta: 0,
  }));

  const activities = [
    ...recentCommentReports.map((r) => ({
      id: `cr-${r.id}`,
      type: 'report_submitted' as const,
      title: 'ریپورت کامنت جدید',
      description:
        r.comments.content.slice(0, 80) +
        (r.comments.content.length > 80 ? '…' : ''),
      actor: r.users.name ?? r.users.email,
      timestamp: r.createdAt,
      href: '/admin/comments/reports?resolved=false',
    })),
    ...recentItemReports.map((r) => ({
      id: `ir-${r.id}`,
      type: 'report_submitted' as const,
      title: 'ریپورت آیتم جدید',
      description: r.items.title,
      actor: r.users.name ?? r.users.email,
      timestamp: r.createdAt,
      href: '/admin/comments/item-reports?resolved=false',
    })),
    ...recentLists.map((l) => ({
      id: l.id,
      type: 'list_created' as const,
      title: 'لیست جدید ایجاد شد',
      description: l.title,
      timestamp: l.createdAt,
      href: `/admin/lists`,
    })),
    ...recentItems.map((i) => ({
      id: i.id,
      type: 'item_added' as const,
      title: 'آیتم جدید اضافه شد',
      description: i.title,
      timestamp: i.createdAt,
      href: i.lists ? `/lists/${i.lists.slug}` : undefined,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const dedupedActivities = dedupeDashboardActivities(activities).slice(0, 12);

  // O(1) lookups for trending scores (js-index-maps / js-set-map-lookups)
  const count24hByList = new Map(
    bookmarks24hByList.map((b) => [b.listId, b._count])
  );
  const count7dByList = new Map(
    bookmarks7dByList.map((b) => [b.listId, b._count])
  );
  const countPrev7dByList = new Map(
    bookmarksPrev7dByList.map((b) => [b.listId, b._count])
  );

  const systemPulse: SystemPulseCard[] = [
    {
      id: 'trending_momentum',
      label: 'شاخص ترند',
      value: trendingListsDb.length,
      deltaPercent:
        listCount > 0 ? Math.round((activeLists7d / listCount) * 100) : 0,
      trend: 'up',
      sparkline: [3, 5, 4, 6, trendingListsDb.length].slice(0, 5),
      semanticColor: 'blue',
      tooltip: 'تعداد لیست‌های برتر در رادار ترند.',
    },
    {
      id: 'active_lists_ratio',
      label: 'لیست‌های فعال ۷ روز',
      value:
        listCount > 0
          ? `${Math.round((activeLists7d / listCount) * 100)}٪`
          : '۰٪',
      deltaPercent: activeLists7d,
      trend: activeLists7d > 0 ? 'up' : 'neutral',
      sparkline: [
        40,
        50,
        55,
        60,
        Math.round((activeLists7d / Math.max(1, listCount)) * 100),
      ],
      semanticColor: 'amber',
      tooltip:
        'سهم لیست‌هایی که در ۷ روز اخیر حداقل یک ذخیره داشته‌اند.',
    },
  ];

  const trendingRadar: TrendingRadarRow[] = trendingListsDb.map((l) => {
    const saves24h = count24hByList.get(l.id) ?? 0;
    const saves7d = count7dByList.get(l.id) ?? 0;
    const savesPrev7d = countPrev7dByList.get(l.id) ?? 0;
    const growth7dPercent =
      savesPrev7d > 0
        ? Math.round(((saves7d - savesPrev7d) / savesPrev7d) * 100)
        : saves7d > 0
          ? 100
          : 0;
    const trendingScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          saves24h * 4 +
            saves7d * 1.5 +
            Math.max(0, growth7dPercent) * 0.35 +
            l.saveCount / 20
        )
      )
    );
    const trend: 'up' | 'down' | 'neutral' =
      growth7dPercent > 2 ? 'up' : growth7dPercent < -2 ? 'down' : 'neutral';
    return {
      id: l.id,
      listName: l.title,
      listSlug: l.slug,
      category: l.categories?.name ?? '—',
      categoryId: l.categoryId ?? undefined,
      viewCount: l.viewCount,
      saves24h,
      saveCount: l.saveCount,
      growth7dPercent,
      trendingScore,
      trend,
      scoreBreakdown: [
        { label: 'ذخیره کل', value: l.saveCount },
        { label: 'بازدید', value: l.viewCount },
        { label: '۲۴h', value: saves24h },
        { label: '۷ روز', value: saves7d },
      ],
    };
  });

  const categoryAccentColors: Record<string, string> = {
    فیلم: '#6366F1',
    کافه: '#10B981',
    کتاب: '#F59E0B',
    پادکست: '#EC4899',
  };
  const categoryIntelligence: CategoryIntelligenceCard[] = categoriesWithCount
    .slice(0, 4)
    .map((c) => {
      const topInCategory = trendingListsDb.find((l) => l.categoryId === c.id);
      const saves7dCat = topInCategory
        ? (count7dByList.get(topInCategory.id) ?? 0)
        : 0;
      const growth = topInCategory
        ? topInCategory.saveCount > 0
          ? Math.min(
              50,
              Math.round(
                (saves7dCat / Math.max(1, topInCategory.saveCount)) * 100
              )
            )
          : 0
        : 0;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        saveGrowthPercent: growth,
        newListsCount: c._count.lists,
        engagementRatio:
          totalListCount > 0 ? (c._count.lists / totalListCount) * 100 : 0,
        topRisingList: topInCategory
          ? {
              id: topInCategory.id,
              title: topInCategory.title,
              slug: topInCategory.slug,
              growthPercent: growth,
            }
          : undefined,
        accentColor: categoryAccentColors[c.name] ?? '#6B7280',
      };
    });

  const riskAlerts: RiskItem[] = [
    ...(commentsModeration.pending > 0
      ? [
          {
            id: 'comments-pending',
            type: 'flagged_list' as const,
            label: 'کامنت در انتظار تایید',
            count: commentsModeration.pending,
            severity: (commentsModeration.pending > 3 ? 'high' : 'medium') as
              | 'high'
              | 'medium',
            href: '/admin/comments/all?filter=pending',
          },
        ]
      : []),
    ...(pendingItemReports > 0
      ? [
          {
            id: 'item-reports',
            type: 'flagged_list' as const,
            label: 'ریپورت آیتم‌ها',
            count: pendingItemReports,
            severity: (pendingItemReports > 2 ? 'high' : 'medium') as
              | 'high'
              | 'medium',
            href: '/admin/comments/item-reports?resolved=false',
          },
        ]
      : []),
    ...(pendingCommentReports > 0
      ? [
          {
            id: 'comment-reports',
            type: 'flagged_list' as const,
            label: 'ریپورت کامنت‌ها',
            count: pendingCommentReports,
            severity: (pendingCommentReports > 2 ? 'high' : 'medium') as
              | 'high'
              | 'medium',
            href: '/admin/comments/reports?resolved=false',
          },
        ]
      : []),
    ...(commentsModeration.filtered > 0
      ? [
          {
            id: 'filtered-comments',
            type: 'anomaly' as const,
            label: 'کلمات فیلترشده',
            count: commentsModeration.filtered,
            severity: 'low' as const,
            href: '/admin/comments/all?filter=filtered',
          },
        ]
      : []),
    ...(pendingSuggestedLists > 0
      ? [
          {
            id: 'pending-lists',
            type: 'suspicious_growth' as const,
            label: 'لیست‌های در انتظار بررسی',
            count: pendingSuggestedLists,
            severity: 'medium' as const,
            href: '/admin/suggestions',
          },
        ]
      : []),
  ];

  return {
    kpis,
    contentOverview,
    periodSnapshot,
    moderationAlerts: [
      {
        id: 'reports',
        type: 'reported_items' as const,
        label: 'ریپورت آیتم‌ها',
        count: pendingItemReports,
        severity: pendingItemReports > 2 ? 'high' : 'medium',
        href: '/admin/comments/item-reports?resolved=false',
      },
      {
        id: 'comment-reports',
        type: 'pending_lists' as const,
        label: 'ریپورت کامنت‌ها',
        count: pendingCommentReports,
        href: '/admin/comments/reports?resolved=false',
      },
      {
        id: 'pending-lists',
        type: 'pending_lists' as const,
        label: 'لیست‌های در انتظار بررسی',
        count: pendingSuggestedLists,
        severity: pendingSuggestedLists > 0 ? 'medium' : 'low',
        href: '/admin/suggestions',
      },
    ],
    topLists,
    topCategories,
    // Legacy fields kept empty — not rendered by current dashboard UI
    topCurators: [],
    activities: dedupedActivities,
    userGrowthData: [],
    listsByCategory: [],
    itemDistribution: [],
    systemPulse,
    trendingRadar,
    categoryIntelligence,
    curatorIntelligence: [],
    riskAlerts,
    commentsModeration,
    range: rangeInput,
    periodLabel,
    actionQueue,
    suggestionPreviews,
  };
}
