/**
 * Admin Dashboard 3.0 – Server-side data fetcher
 * Blends real DB data with mock for missing metrics
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCommentsHubStats } from './comments-hub-stats';
import { getDashboardPeriod, type DashboardRange } from './dashboard-range';
import type {
  DashboardData,
  KpiItem,
  SystemPulseCard,
  TrendingRadarRow,
  CategoryIntelligenceCard,
  CuratorIntelligenceRow,
  RiskItem,
  ActionQueueItem,
} from './types';

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

export async function getDashboardData(
  rangeInput: DashboardRange = 'today'
): Promise<DashboardData> {
  const {
    periodStart,
    prevPeriodStart,
    prevPeriodEnd,
    periodLabel,
    bookmarkWindowStart,
    last7d,
    last24h,
  } = getDashboardPeriod(rangeInput);

  const [
    userCount,
    listCount,
    periodUsers,
    prevPeriodUsers,
    periodLists,
    prevPeriodLists,
    periodBookmarks,
    prevPeriodBookmarks,
    commentsHub,
    pendingSuggestedLists,
    recentSuggestedPreviews,
    recentCommentReports,
    recentItemReports,
    topCuratorsDb,
    topListsDb,
    categoriesWithCount,
    userGrowth,
    recentLists,
    recentItems,
    listsWithViews,
    bookmarks7d,
    bookmarks24hByList,
    bookmarks7dByList,
    bookmarksPrev7dByList,
    trendingListsDb,
    activeLists7d,
  ] = await Promise.all([
    dbQuery(() => prisma.users.count()),
    dbQuery(() => prisma.lists.count({ where: { isActive: true } })),
    dbQuery(() => prisma.users.count({ where: { createdAt: { gte: periodStart } } })),
    dbQuery(() =>
      prisma.users.count({
        where: {
          createdAt: { gte: prevPeriodStart, lt: prevPeriodEnd },
        },
      })
    ),
    dbQuery(() => prisma.lists.count({ where: { createdAt: { gte: periodStart } } })),
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
    dbQuery(() => getCommentsHubStats()),
    dbQuery(() =>
      prisma.suggested_lists.count({ where: { status: 'pending' } }),
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
      prisma.users.findMany({
        where: {
          lists: { some: { isActive: true } },
          OR: [{ curatorScore: { gt: 0 } }, { lists: { some: {} } }],
        },
        orderBy: [{ curatorScore: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          curatorScore: true,
          _count: { select: { lists: true } },
        },
      })
    ),
    dbQuery(() =>
      prisma.lists.findMany({
        where: { isActive: true, isPublic: true },
        orderBy: { saveCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          saveCount: true,
          viewCount: true,
          categories: { select: { name: true } },
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
    dbQuery(async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const users = await prisma.users.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      });
      const monthCounts: Record<number, number> = {};
      users.forEach((u) => {
        const m = new Date(u.createdAt).getMonth();
        monthCounts[m] = (monthCounts[m] || 0) + 1;
      });
      const cur = new Date().getMonth();
      return Array.from({ length: 6 }, (_, i) => {
        const idx = (cur - 5 + i + 12) % 12;
        return { month: persianMonths[idx], users: monthCounts[idx] || 0 };
      });
    }),
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
        select: { id: true, title: true, lists: { select: { slug: true } }, createdAt: true },
      })
    ),
    dbQuery(() =>
      prisma.lists.aggregate({
        where: { isActive: true },
        _sum: { viewCount: true },
      })
    ),
    dbQuery(() => prisma.bookmarks.count({ where: { createdAt: { gte: last7d } } })),
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
    dbQuery(() => {
      const prev7dStart = new Date(last7d.getTime() - 7 * 24 * 60 * 60 * 1000);
      return prisma.bookmarks.groupBy({
        by: ['listId'],
        where: { createdAt: { gte: prev7dStart, lt: last7d } },
        _count: true,
      });
    }),
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

  const totalViews = listsWithViews._sum.viewCount ?? 0;
  const totalSaves = await dbQuery(() =>
    prisma.lists.aggregate({ where: { isActive: true }, _sum: { saveCount: true } })
  ).then((r) => r._sum.saveCount ?? 0);
  const saveRate = totalViews > 0 ? ((totalSaves / totalViews) * 100).toFixed(1) : '۰';
  const pendingItemReports = commentsHub.itemReportsOpen;
  const pendingCommentReports = commentsHub.commentReports.open;
  const pendingReports =
    pendingItemReports +
    pendingCommentReports +
    pendingSuggestedLists +
    commentsHub.comments.pending;

  const commentsModeration = {
    pending: commentsHub.comments.pending,
    flagged: commentsHub.comments.flagged,
    reported: commentsHub.comments.reported,
    filtered: commentsHub.filteredComments,
    approved: commentsHub.comments.approved,
    unresolvedCommentReports: commentsHub.commentReports.open,
    unresolvedItemReports: commentsHub.itemReportsOpen,
    totalCommentReports: commentsHub.commentReports.total,
  };

  const delta = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

  const velocityDelta =
    prevPeriodBookmarks > 0
      ? delta(periodBookmarks, prevPeriodBookmarks)
      : periodBookmarks > 0
        ? 100
        : 0;

  const actionQueue: ActionQueueItem[] = [
    ...(commentsHub.comments.pending > 0
      ? [
          {
            id: 'action-comments-pending',
            label: 'کامنت در انتظار',
            count: commentsHub.comments.pending,
            href: '/admin/comments/all?filter=pending',
            severity: (commentsHub.comments.pending > 3 ? 'high' : 'medium') as
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

  const kpis: KpiItem[] = [
    {
      label: `کاربران جدید (${periodLabel})`,
      value: periodUsers,
      delta: delta(periodUsers, prevPeriodUsers),
      trend: periodUsers >= prevPeriodUsers ? 'up' : 'down',
    },
    {
      label: `لیست‌های جدید (${periodLabel})`,
      value: periodLists,
      delta: delta(periodLists, prevPeriodLists),
      trend: periodLists >= prevPeriodLists ? 'up' : 'down',
    },
    {
      label: `ذخیره (${periodLabel})`,
      value: periodBookmarks,
      delta: delta(periodBookmarks, prevPeriodBookmarks),
      trend: periodBookmarks >= prevPeriodBookmarks ? 'up' : 'down',
    },
    {
      label: 'نرخ ذخیره',
      value: `${saveRate}٪`,
      delta: 0,
      trend: 'neutral',
    },
    {
      label: 'ریپورت‌های در انتظار',
      value: pendingReports,
      delta: 0,
      trend: pendingReports > 0 ? 'up' : 'neutral',
    },
  ];

  const totalListCount = categoriesWithCount.reduce(
    (sum, c) => sum + c._count.lists,
    0
  );

  const topLists = topListsDb.map((l) => ({
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
    sharePercent: totalListCount > 0 ? Math.round((c._count.lists / totalListCount) * 100) : 0,
    delta: 0,
  }));

  const listsByCategory = categoriesWithCount
    .map((c) => ({ category: c.name, count: c._count.lists }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const itemDistribution = [
    { name: 'فعال', value: 85, color: '#10B981' },
    { name: 'غیرفعال', value: 15, color: '#EF4444' },
  ];

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
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 12);

  const count24hByList = new Map(bookmarks24hByList.map((b) => [b.listId, b._count]));
  const count7dByList = new Map(bookmarks7dByList.map((b) => [b.listId, b._count]));
  const countPrev7dByList = new Map(
    bookmarksPrev7dByList.map((b) => [b.listId, b._count])
  );

  const systemPulse: SystemPulseCard[] = [
    {
      id: 'save_velocity',
      label: 'سرعت ذخیره',
      value: periodBookmarks,
      deltaPercent: velocityDelta,
      trend:
        velocityDelta > 0 ? 'up' : velocityDelta < 0 ? 'down' : 'neutral',
      sparkline: [
        prevPeriodBookmarks,
        periodBookmarks,
        periodBookmarks,
        periodBookmarks,
        periodBookmarks,
      ],
      semanticColor: velocityDelta >= 0 ? 'emerald' : 'red',
      tooltip: `ذخیره‌های ${periodLabel} نسبت به دوره قبل.`,
    },
    {
      id: 'trending_momentum',
      label: 'شاخص ترند',
      value: trendingListsDb.length,
      deltaPercent: listCount > 0 ? Math.round((activeLists7d / listCount) * 100) : 0,
      trend: 'up',
      sparkline: [3, 5, 4, 6, trendingListsDb.length].slice(0, 5),
      semanticColor: 'blue',
      tooltip: 'وضعیت کلی لیست‌های درگیر؛ هرچه بیشتر سالم‌تر.',
    },
    {
      id: 'active_lists_ratio',
      label: 'نسبت لیست‌های فعال',
      value: listCount > 0 ? `${Math.round((activeLists7d / listCount) * 100)}٪` : '۰٪',
      deltaPercent: 0,
      trend: 'neutral',
      sparkline: [40, 50, 55, 60, Math.round((activeLists7d / Math.max(1, listCount)) * 100)],
      semanticColor: 'amber',
      tooltip: 'سهم لیست‌هایی که در ۷ روز اخیر حداقل یک ذخیره داشته‌اند.',
    },
    {
      id: 'risk_alerts',
      label: 'هشدار ریسک',
      value: pendingReports,
      deltaPercent: 0,
      trend: pendingReports > 0 ? 'up' : 'neutral',
      sparkline: [0, pendingItemReports, pendingCommentReports, pendingSuggestedLists, pendingReports].filter((n) => n !== undefined) as number[],
      semanticColor: pendingReports > 0 ? 'red' : 'emerald',
      tooltip: 'ریپورت‌های حل‌نشده و لیست‌های در انتظار بررسی.',
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
      saves24h,
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
  const categoryIntelligence: CategoryIntelligenceCard[] = categoriesWithCount.slice(0, 4).map((c) => {
    const topInCategory = trendingListsDb.find((l) => l.categoryId === c.id);
    const saves7dCat = topInCategory ? count7dByList.get(topInCategory.id) ?? 0 : 0;
    const growth = topInCategory ? (topInCategory.saveCount > 0 ? Math.min(50, Math.round((saves7dCat / Math.max(1, topInCategory.saveCount)) * 100)) : 0) : 0;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      saveGrowthPercent: growth,
      newListsCount: c._count.lists,
      engagementRatio: totalListCount > 0 ? (c._count.lists / totalListCount) * 100 : 0,
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

  const curatorIntelligence: CuratorIntelligenceRow[] = topCuratorsDb.map((c, i) => {
    const listsCount = c._count.lists;
    const score = c.curatorScore ?? 0;
    const growthPercent = Math.min(
      99,
      Math.round(score * 12 + listsCount * 4)
    );
    const trustBadge: CuratorIntelligenceRow['trustBadge'] =
      score >= 5 || listsCount >= 5
        ? 'high_growth'
        : listsCount >= 1 || score >= 1
          ? 'stable'
          : 'risky';
    return {
      id: c.id,
      name: c.name ?? 'بدون نام',
      username: c.username,
      avatarUrl: c.image,
      growthPercent,
      avgSavesPerList: listsCount > 0 ? Math.max(1, Math.round(score * 2)) : 0,
      trustBadge,
      rank: i + 1,
    };
  });

  const riskAlerts: RiskItem[] = [
    ...(commentsHub.comments.pending > 0
      ? [
          {
            id: 'comments-pending',
            type: 'flagged_list' as const,
            label: 'کامنت در انتظار تایید',
            count: commentsHub.comments.pending,
            severity: (commentsHub.comments.pending > 3 ? 'high' : 'medium') as
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
            severity: (pendingItemReports > 2 ? 'high' : 'medium') as 'high' | 'medium',
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
    ...(commentsHub.filteredComments > 0
      ? [
          {
            id: 'filtered-comments',
            type: 'anomaly' as const,
            label: 'کلمات فیلترشده',
            count: commentsHub.filteredComments,
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
    topCurators: curatorIntelligence.map((c) => ({
      id: c.id,
      name: c.name,
      username: c.username,
      followers: 0,
      saves: c.avgSavesPerList * 5,
      growthPercent: c.growthPercent,
      reliability:
        c.trustBadge === 'high_growth'
          ? 'high'
          : c.trustBadge === 'stable'
            ? 'medium'
            : 'low',
    })),
    activities,
    userGrowthData: userGrowth,
    listsByCategory,
    itemDistribution,
    systemPulse,
    trendingRadar,
    categoryIntelligence,
    curatorIntelligence,
    riskAlerts,
    commentsModeration,
    range: rangeInput,
    periodLabel,
    actionQueue,
    suggestionPreviews,
  };
}
