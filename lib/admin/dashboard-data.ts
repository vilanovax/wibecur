/**
 * Admin Dashboard 3.0 – Server-side data fetcher
 * Blends real DB data with mock for missing metrics
 */

import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { MOCK_MODERATION, MOCK_TOP_CURATORS } from './mock';
import type {
  DashboardData,
  KpiItem,
  SystemPulseCard,
  TrendingRadarRow,
  CategoryIntelligenceCard,
  CuratorIntelligenceRow,
  RiskItem,
} from './types';

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

export async function getDashboardData(): Promise<DashboardData> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const prev7dStart = new Date(last7d);
  prev7dStart.setDate(prev7dStart.getDate() - 7);

  const [
    userCount,
    listCount,
    todayUsers,
    yesterdayUsers,
    todayLists,
    yesterdayLists,
    todayBookmarks,
    yesterdayBookmarks,
    pendingItemReports,
    pendingCommentReports,
    pendingSuggestedLists,
    topListsDb,
    categoriesWithCount,
    userGrowth,
    recentLists,
    recentItems,
    listsWithViews,
    bookmarks7d,
    bookmarks24hByList,
    bookmarks7dByList,
    trendingListsDb,
    activeLists7d,
  ] = await Promise.all([
    dbQuery(() => prisma.users.count()),
    dbQuery(() => prisma.lists.count({ where: { isActive: true } })),
    dbQuery(() => prisma.users.count({ where: { createdAt: { gte: todayStart } } })),
    dbQuery(() =>
      prisma.users.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
      })
    ),
    dbQuery(() => prisma.lists.count({ where: { createdAt: { gte: todayStart } } })),
    dbQuery(() =>
      prisma.lists.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
      })
    ),
    dbQuery(() =>
      prisma.bookmarks.count({ where: { createdAt: { gte: todayStart } } })
    ),
    dbQuery(() =>
      prisma.bookmarks.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
      })
    ),
    dbQuery(() => prisma.item_reports.count({ where: { resolved: false } })),
    dbQuery(() => prisma.comment_reports.count({ where: { resolved: false } })),
    dbQuery(() =>
      prisma.suggested_lists.count({ where: { status: 'pending' } }),
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
        include: { _count: { select: { lists: true } } },
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
    dbQuery(() => prisma.bookmarks.groupBy({
      by: ['listId'],
      where: { createdAt: { gte: last24h } },
      _count: true,
    })),
    dbQuery(() => prisma.bookmarks.groupBy({
      by: ['listId'],
      where: { createdAt: { gte: last7d } },
      _count: true,
    })),
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
  const pendingReports = pendingItemReports + pendingCommentReports;

  const delta = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

  const kpis: KpiItem[] = [
    {
      label: 'کاربران فعال امروز',
      value: todayUsers,
      delta: delta(todayUsers, yesterdayUsers),
      trend: todayUsers >= yesterdayUsers ? 'up' : 'down',
    },
    {
      label: 'کاربران جدید امروز',
      value: todayUsers,
      delta: delta(todayUsers, yesterdayUsers),
      trend: todayUsers >= yesterdayUsers ? 'up' : 'down',
    },
    {
      label: 'لیست‌های جدید امروز',
      value: todayLists,
      delta: delta(todayLists, yesterdayLists),
      trend: todayLists >= yesterdayLists ? 'up' : 'down',
    },
    {
      label: 'ذخیره امروز',
      value: todayBookmarks,
      delta: delta(todayBookmarks, yesterdayBookmarks),
      trend: todayBookmarks >= yesterdayBookmarks ? 'up' : 'down',
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
    .slice(0, 10);

  const count24hByList = new Map(bookmarks24hByList.map((b) => [b.listId, b._count]));
  const count7dByList = new Map(bookmarks7dByList.map((b) => [b.listId, b._count]));
  const velocityDelta = yesterdayBookmarks > 0 ? delta(todayBookmarks, yesterdayBookmarks) : 0;

  const systemPulse: SystemPulseCard[] = [
    {
      id: 'save_velocity',
      label: 'سرعت ذخیره',
      value: todayBookmarks,
      deltaPercent: velocityDelta,
      trend: velocityDelta >= 0 ? 'up' : 'down',
      sparkline: [yesterdayBookmarks, todayBookmarks, todayBookmarks, todayBookmarks, todayBookmarks].filter(Boolean).length ? [yesterdayBookmarks, todayBookmarks, todayBookmarks, todayBookmarks, todayBookmarks] : [2, 4, 3, 5, 4],
      semanticColor: velocityDelta >= 0 ? 'emerald' : 'red',
      tooltip: 'ذخیره‌های ۲۴ ساعت گذشته در مقایسه با دیروز؛ هسته رشد پلتفرم.',
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
      value: pendingItemReports + pendingCommentReports + pendingSuggestedLists,
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
    const prev7d = Math.max(0, l.saveCount - saves7d);
    const growth7dPercent = prev7d > 0 ? Math.round(((saves7d - prev7d) / prev7d) * 100) : saves7d > 0 ? 100 : 0;
    const trendingScore = Math.min(100, Math.round(l.saveCount / 10) + growth7dPercent);
    const trend: 'up' | 'down' | 'neutral' = growth7dPercent > 0 ? 'up' : growth7dPercent < 0 ? 'down' : 'neutral';
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

  const curatorIntelligence: CuratorIntelligenceRow[] = MOCK_TOP_CURATORS.slice(0, 5).map((c, i) => ({
    id: c.id,
    name: c.name,
    username: c.username,
    avatarUrl: null,
    growthPercent: c.growthPercent ?? 0,
    avgSavesPerList: c.saves > 0 ? Math.round(c.saves / 5) : 0,
    trustBadge: c.reliability === 'high' ? 'high_growth' : c.reliability === 'medium' ? 'stable' : 'risky',
    rank: i + 1,
  }));

  const riskAlerts: RiskItem[] = [
    ...(pendingItemReports > 0
      ? [
          {
            id: 'item-reports',
            type: 'flagged_list' as const,
            label: 'ریپورت آیتم‌ها',
            count: pendingItemReports,
            severity: (pendingItemReports > 2 ? 'high' : 'medium') as 'high' | 'medium',
            href: '/admin/comments/item-reports',
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
            severity: 'medium' as const,
            href: '/admin/comments/reports',
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
        href: '/admin/comments/item-reports',
      },
      {
        id: 'comment-reports',
        type: 'pending_lists' as const,
        label: 'ریپورت کامنت‌ها',
        count: pendingCommentReports,
        href: '/admin/comments/reports',
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
    topCurators: MOCK_TOP_CURATORS, // TODO: replace with real curator aggregation
    activities,
    userGrowthData: userGrowth,
    listsByCategory,
    itemDistribution,
    systemPulse,
    trendingRadar,
    categoryIntelligence,
    curatorIntelligence,
    riskAlerts,
  };
}
