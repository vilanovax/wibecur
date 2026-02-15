import { computeTrendScore } from './utils';
import type { CuratedList, Curator, CuratedCategory } from '@/types/curated';

export const MOCK_CATEGORIES: CuratedCategory[] = [
  { id: 'all', title: 'همه', icon: '📋' },
  { id: 'cat1', slug: 'film', title: 'فیلم و سریال', icon: '🎬' },
  { id: 'cat2', slug: 'cafe', title: 'کافه و رستوران', icon: '☕' },
  { id: 'cat3', slug: 'book', title: 'کتاب', icon: '📚' },
  { id: 'cat4', slug: 'podcast', title: 'پادکست', icon: '🎧' },
  { id: 'cat5', slug: 'travel', title: 'سفر', icon: '✈️' },
];

const avatarBase = 'https://i.pravatar.cc/150?u=';
const coverBase = 'https://picsum.photos/seed/';

function c(id: number, w = 400, h = 300) {
  return `${coverBase}list${id}/${w}/${h}`;
}
function a(id: string) {
  return `${avatarBase}${id}`;
}

export const MOCK_CURATORS: Curator[] = [
  {
    id: 'cur1',
    name: 'مریم محمدی',
    username: 'maryam_m',
    avatarUrl: a('cur1'),
    levelTitle: 'کیوریتور برتر',
    badges: ['top'],
    followersCount: 12400,
    totalSaves: 45200,
    listsCount: 12,
    weeklyGrowthPercent: 8,
    savesLast7d: 1200,
  },
  {
    id: 'cur2',
    name: 'علی رضایی',
    username: 'ali_r',
    avatarUrl: a('cur2'),
    levelTitle: 'در حال رشد',
    badges: ['rising'],
    followersCount: 3200,
    totalSaves: 8900,
    listsCount: 5,
    weeklyGrowthPercent: 45,
    savesLast7d: 450,
  },
  {
    id: 'cur3',
    name: 'سارا احمدی',
    username: 'sara_a',
    avatarUrl: a('cur3'),
    levelTitle: 'الیت',
    badges: ['elite'],
    followersCount: 28500,
    totalSaves: 120000,
    listsCount: 28,
    weeklyGrowthPercent: 2,
    savesLast7d: 2100,
  },
  {
    id: 'cur4',
    name: 'رضا کریمی',
    username: 'reza_k',
    avatarUrl: a('cur4'),
    levelTitle: 'کیوریتور',
    badges: ['featured'],
    followersCount: 5600,
    totalSaves: 18200,
    listsCount: 9,
    weeklyGrowthPercent: 22,
    savesLast7d: 680,
  },
  {
    id: 'cur5',
    name: 'نرگس نوری',
    username: 'narges_n',
    avatarUrl: a('cur5'),
    levelTitle: 'در حال رشد',
    badges: ['rising'],
    followersCount: 1800,
    totalSaves: 4200,
    listsCount: 4,
    weeklyGrowthPercent: 65,
    savesLast7d: 320,
  },
  {
    id: 'cur6',
    name: 'امیر حسینی',
    username: 'amir_h',
    avatarUrl: a('cur6'),
    levelTitle: 'کیوریتور برتر',
    badges: ['top'],
    followersCount: 15200,
    totalSaves: 58000,
    listsCount: 15,
    weeklyGrowthPercent: 5,
    savesLast7d: 1500,
  },
  {
    id: 'cur7',
    name: 'زهرا موسوی',
    username: 'zahra_m',
    avatarUrl: a('cur7'),
    levelTitle: 'کیوریتور',
    badges: ['ai'],
    followersCount: 4200,
    totalSaves: 11200,
    listsCount: 7,
    weeklyGrowthPercent: 18,
    savesLast7d: 410,
  },
  {
    id: 'cur8',
    name: 'محمد صادقی',
    username: 'mohammad_s',
    avatarUrl: a('cur8'),
    levelTitle: 'در حال رشد',
    badges: ['rising'],
    followersCount: 950,
    totalSaves: 2100,
    listsCount: 3,
    weeklyGrowthPercent: 120,
    savesLast7d: 180,
  },
];

function createList(
  id: number,
  title: string,
  creator: Curator,
  categoryId: string,
  opts: {
    saves?: number;
    likes?: number;
    items?: number;
    badges?: CuratedList['badges'];
    savesLast7d?: number;
    likesLast7d?: number;
    viewsLast7d?: number;
    weeklyVelocity?: number;
    daysAgo?: number;
    subtitle?: string;
    growthPercent24h?: number;
    rating?: number;
  } = {}
): CuratedList {
  const saves = opts.saves ?? 100 + id * 50;
  const likes = opts.likes ?? Math.floor(saves * 0.3);
  const items = opts.items ?? 8 + (id % 12);
  const daysAgo = opts.daysAgo ?? id % 14;
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const savesLast7d = opts.savesLast7d ?? Math.floor(saves * 0.15);
  const likesLast7d = opts.likesLast7d ?? Math.floor(likes * 0.2);
  const viewsLast7d = opts.viewsLast7d ?? savesLast7d * 5;

  const raw = {
    id: `list${id}`,
    slug: `list-${id}`,
    title,
    subtitle: opts.subtitle ?? null,
    categoryId,
    coverUrl: c(id),
    itemsCount: items,
    savesCount: saves,
    likesCount: likes,
    badges: opts.badges ?? [],
    creator: {
      id: creator.id,
      name: creator.name,
      username: creator.username,
      avatarUrl: creator.avatarUrl,
      levelTitle: creator.levelTitle,
      badges: creator.badges,
    },
    createdAt,
    trendScore: 0,
    weeklyVelocity: opts.weeklyVelocity ?? savesLast7d,
    viewsLast7d,
    savesLast7d,
    likesLast7d,
    growthPercent24h: opts.growthPercent24h ?? Math.floor(5 + Math.random() * 35),
    rating: opts.rating ?? 3.5 + Math.random() * 1.5,
  };

  raw.trendScore = computeTrendScore(raw);
  return raw;
}

export function getMockLists(): CuratedList[] {
  const [c1, c2, c3, c4, c5, c6, c7, c8] = MOCK_CURATORS;
  return [
    createList(1, 'بهترین فیلم‌های سال ۱۴۰۳', c1, 'cat1', {
      saves: 2400,
      badges: ['trending'],
      savesLast7d: 320,
      daysAgo: 2,
      subtitle: '۲۰ فیلم برتر امسال',
      growthPercent24h: 34,
      rating: 4.8,
    }),
    createList(2, 'کافه‌های دنج تهران', c4, 'cat2', {
      saves: 1200,
      badges: ['rising'],
      savesLast7d: 180,
      daysAgo: 5,
      subtitle: 'از شمال تا جنوب شهر',
      growthPercent24h: 22,
      rating: 4.5,
    }),
    createList(3, 'کتاب‌هایی که زندگی‌ام را عوض کردند', c3, 'cat3', {
      saves: 5800,
      badges: ['featured'],
      savesLast7d: 210,
      daysAgo: 10,
    }),
    createList(4, 'پادکست‌های صبحگاهی', c2, 'cat4', {
      saves: 890,
      badges: ['rising'],
      savesLast7d: 95,
      daysAgo: 1,
      subtitle: 'برای شروع روز پرانرژی',
    }),
    createList(5, 'سریال‌های ایرانی بی‌نظیر', c1, 'cat1', {
      saves: 3200,
      badges: ['trending', 'featured'],
      savesLast7d: 420,
      daysAgo: 3,
      growthPercent24h: 48,
      rating: 4.9,
    }),
    createList(6, 'رستوران‌های گردشگری تهران', c6, 'cat2', {
      saves: 2100,
      badges: ['trending'],
      savesLast7d: 280,
      daysAgo: 4,
      growthPercent24h: 18,
      rating: 4.6,
    }),
    createList(7, 'کتاب‌های توسعه فردی', c3, 'cat3', {
      saves: 4500,
      badges: ['featured'],
      savesLast7d: 150,
      daysAgo: 12,
    }),
    createList(8, 'پادکست‌های طنز', c7, 'cat4', {
      saves: 670,
      badges: ['ai'],
      savesLast7d: 88,
      daysAgo: 6,
      subtitle: 'پیشنهاد هوش مصنوعی',
    }),
    createList(9, 'فیلم‌های کلاسیک سینمای ایران', c1, 'cat1', {
      saves: 1800,
      badges: [],
      savesLast7d: 120,
      daysAgo: 8,
    }),
    createList(10, 'مقاصد سفر ایران', c6, 'cat5', {
      saves: 3500,
      badges: ['trending', 'rising'],
      savesLast7d: 380,
      daysAgo: 2,
      subtitle: '۲۰ مقصد رویایی',
      growthPercent24h: 55,
      rating: 4.7,
    }),
    createList(11, 'کافه‌بوک‌های تهران', c4, 'cat2', {
      saves: 950,
      badges: ['rising'],
      savesLast7d: 140,
      daysAgo: 7,
    }),
    createList(12, 'پادکست‌های روانشناسی', c2, 'cat4', {
      saves: 1200,
      badges: [],
      savesLast7d: 110,
      daysAgo: 9,
    }),
    createList(13, 'سریال‌های خارجی پیشنهادی', c1, 'cat1', {
      saves: 2800,
      badges: ['trending'],
      savesLast7d: 250,
      daysAgo: 4,
    }),
    createList(14, 'کتاب‌های داستانی ۱۴۰۳', c3, 'cat3', {
      saves: 1600,
      badges: ['featured'],
      savesLast7d: 90,
      daysAgo: 11,
    }),
    createList(15, 'غذاخوری‌های خیابان ولیعصر', c4, 'cat2', {
      saves: 780,
      badges: [],
      savesLast7d: 65,
      daysAgo: 5,
    }),
    createList(16, 'فیلم‌های اکشن برتر', c6, 'cat1', {
      saves: 1900,
      badges: [],
      savesLast7d: 130,
      daysAgo: 6,
    }),
    createList(17, 'پادکست‌های کسب‌وکار', c7, 'cat4', {
      saves: 1100,
      badges: ['ai'],
      savesLast7d: 95,
      daysAgo: 3,
    }),
    createList(18, 'جاذبه‌های گردشگری شمال', c6, 'cat5', {
      saves: 2400,
      badges: ['trending'],
      savesLast7d: 200,
      daysAgo: 1,
    }),
    createList(19, 'کتاب‌های موفقیت', c3, 'cat3', {
      saves: 3200,
      badges: ['featured'],
      savesLast7d: 180,
      daysAgo: 14,
    }),
    createList(20, 'کافه‌های کار کردن', c5, 'cat2', {
      saves: 520,
      badges: ['rising'],
      savesLast7d: 85,
      daysAgo: 2,
      subtitle: 'وای‌فای خوب و فضای آرام',
    }),
  ];
}
