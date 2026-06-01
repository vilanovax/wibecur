import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCachedGlobalTrending, getCachedFastRising } from '@/lib/trending/cached';
import { getCurrentFeaturedSlot } from '@/lib/home-featured';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import type {
  FeaturedListData,
  HomeData,
  HomeListData,
  RisingListData,
} from '@/types/home-data';

export type HomeApiPayload = {
  featured: FeaturedListData | null;
  featuredSlotId: string | null;
  trending: HomeListData[];
  rising: RisingListData[];
  recommendations: HomeListData[];
};

export async function fetchHomePageData(): Promise<HomeData> {
  let slotResult: Awaited<ReturnType<typeof getCurrentFeaturedSlot>> = null;
  try {
    slotResult = await dbQuery(() => getCurrentFeaturedSlot(prisma));
  } catch (slotErr) {
    console.warn('getCurrentFeaturedSlot failed, using fallback:', slotErr);
  }

  const [lists, trendingResults, risingResults] = await Promise.all([
    dbQuery(() =>
      prisma.lists.findMany({
        where: {
          isActive: true,
          isPublic: true,
          users: { role: { not: 'USER' } },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          saveCount: true,
          itemCount: true,
          likeCount: true,
          isFeatured: true,
          badge: true,
          userId: true,
          categories: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          users: {
            select: { id: true, name: true, username: true },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { saveCount: 'desc' }],
        take: 10,
      })
    ),
    getCachedGlobalTrending(6),
    getCachedFastRising(6),
  ]);

  const featuredFromSlot = slotResult?.list ?? null;
  const featured = featuredFromSlot ?? (lists.length > 0 ? lists[0] : null);
  const featuredSlotId = slotResult?.slotId ?? null;

  const withCover = (input: {
    coverImage?: string | null;
    slug: string;
    title: string;
    categorySlug?: string | null;
  }) =>
    resolveCoverImage({
      coverImage: input.coverImage,
      categorySlug: input.categorySlug,
      listSlug: input.slug,
      listTitle: input.title,
    });

  const mapList = (l: (typeof lists)[0]): HomeListData => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    description: l.description ?? '',
    coverImage: withCover({
      coverImage: l.coverImage,
      slug: l.slug,
      title: l.title,
      categorySlug: l.categories?.slug,
    }),
    saveCount: l.saveCount ?? 0,
    itemCount: l.itemCount ?? 0,
    likes: l.likeCount ?? 0,
    badge: (l.isFeatured ? 'featured' : (l.badge?.toLowerCase() ?? undefined)) as
      | 'trending'
      | 'new'
      | 'featured'
      | undefined,
    categories: l.categories,
  });

  const mapTrending = (t: (typeof trendingResults)[0]): HomeListData => ({
    id: t.listId,
    title: t.title,
    slug: t.slug,
    description: '',
    coverImage: withCover({
      coverImage: t.coverImage,
      slug: t.slug,
      title: t.title,
      categorySlug: t.categorySlug,
    }),
    saveCount: t.saveCount,
    itemCount: t.itemCount,
    likes: t.likeCount,
    badge: (t.badge === 'viral' ? 'trending' : t.badge === 'hot' ? 'trending' : undefined) as
      | 'trending'
      | 'new'
      | 'featured'
      | undefined,
    categories: t.categorySlug
      ? { slug: t.categorySlug, name: '', id: '', icon: '' }
      : undefined,
  });

  const mapRising = (r: (typeof risingResults)[0]): RisingListData => ({
    id: r.listId,
    title: r.title,
    slug: r.slug,
    description: '',
    coverImage: withCover({
      coverImage: r.coverImage,
      slug: r.slug,
      title: r.title,
      categorySlug: r.categorySlug,
    }),
    saveCount: r.saveCount,
    itemCount: r.itemCount,
    likes: r.likeCount,
    isFastRising: r.isFastRising ?? false,
    categories: r.categorySlug
      ? { slug: r.categorySlug, name: '', id: '', icon: '' }
      : undefined,
  });

  const mapFeatured: FeaturedListData | null = featured
    ? {
        ...mapList(featured as (typeof lists)[0]),
        creator: featured.users
          ? { name: featured.users.name, username: featured.users.username }
          : null,
      }
    : null;

  return {
    featured: mapFeatured,
    featuredSlotId,
    trending: trendingResults.map(mapTrending),
    rising: risingResults.map(mapRising),
    recommendations: lists.slice(0, 4).map(mapList),
  };
}
