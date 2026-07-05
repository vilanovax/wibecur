import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { getCachedGlobalTrending, getCachedFastRising } from '@/lib/trending/cached';
import { getCurrentFeaturedSlot } from '@/lib/home-featured';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import { resolveListBannerImage } from '@/lib/list-display-images';
import type {
  FeaturedListData,
  HomeData,
  HomeListData,
  RisingListData,
} from '@/types/home-data';
import { EMPTY_HOME_DATA } from '@/types/home-data';
import {
  filterListsInActiveCategories,
  publicCuratedListWhere,
  isListVisibleInPublicFeed,
} from '@/lib/public-content-filters';
import { dedupeListsById } from '@/lib/dedupe-lists';

export type HomeApiPayload = {
  featured: FeaturedListData | null;
  featuredSlotId: string | null;
  trending: HomeListData[];
  rising: RisingListData[];
  recommendations: HomeListData[];
};

export async function fetchHomePageData(): Promise<HomeData> {
  try {
  let slotResult: Awaited<ReturnType<typeof getCurrentFeaturedSlot>> = null;
  try {
    slotResult = await dbQuery(() => getCurrentFeaturedSlot(prisma));
  } catch (slotErr) {
    console.warn('getCurrentFeaturedSlot failed, using fallback:', slotErr);
  }

  const [lists, trendingResults, risingResults] = await Promise.all([
    dbQuery(() =>
      prisma.lists.findMany({
        where: publicCuratedListWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
        coverImage: true,
        horizontalImage: true,
        saveCount: true,
          itemCount: true,
          likeCount: true,
          isFeatured: true,
          badge: true,
          userId: true,
          categories: {
            select: { id: true, name: true, slug: true, icon: true, isActive: true },
          },
          users: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { saveCount: 'desc' }],
        take: 10,
      })
    ),
    getCachedGlobalTrending(10),
    getCachedFastRising(10),
  ]);

  const visibleLists = filterListsInActiveCategories(lists);
  const slotList =
    slotResult?.list && isListVisibleInPublicFeed(slotResult.list)
      ? slotResult.list
      : null;
  const featuredFromSlot = slotList;
  const featured = featuredFromSlot ?? (visibleLists.length > 0 ? visibleLists[0] : null);
  const featuredSlotId = slotResult?.slotId ?? null;

  const withCover = (input: {
    coverImage?: string | null;
    horizontalImage?: string | null;
    slug: string;
    title: string;
    categorySlug?: string | null;
  }) => {
    const source = {
      coverImage: input.coverImage,
      horizontalImage: input.horizontalImage,
      slug: input.slug,
      title: input.title,
      categorySlug: input.categorySlug,
    };
    return {
      coverImage: resolveCoverImage({
        coverImage: input.coverImage,
        categorySlug: input.categorySlug,
        listSlug: input.slug,
        listTitle: input.title,
      }),
      bannerImage: resolveListBannerImage(source),
    };
  };

  const mapList = (l: (typeof lists)[0]): HomeListData => {
    const images = withCover({
      coverImage: l.coverImage,
      horizontalImage: l.horizontalImage,
      slug: l.slug,
      title: l.title,
      categorySlug: l.categories?.slug,
    });
    return {
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description ?? '',
      coverImage: images.coverImage,
      horizontalImage: l.horizontalImage,
      bannerImage: images.bannerImage,
      saveCount: l.saveCount ?? 0,
      itemCount: l.itemCount ?? 0,
      likes: l.likeCount ?? 0,
      badge: (l.isFeatured ? 'featured' : (l.badge?.toLowerCase() ?? undefined)) as
        | 'trending'
        | 'new'
        | 'featured'
        | undefined,
      categories: l.categories,
      creator: l.users
        ? {
            id: l.users.id,
            name: l.users.name,
            username: l.users.username,
            image: l.users.image,
          }
        : null,
    };
  };

  const mapTrending = (t: (typeof trendingResults)[0]): HomeListData => {
    const images = withCover({
      coverImage: t.coverImage,
      horizontalImage: t.horizontalImage,
      slug: t.slug,
      title: t.title,
      categorySlug: t.categorySlug,
    });
    return {
      id: t.listId,
      title: t.title,
      slug: t.slug,
      description: '',
      coverImage: images.coverImage,
      horizontalImage: t.horizontalImage,
      bannerImage: images.bannerImage,
      saveCount: t.saveCount,
      itemCount: t.itemCount,
      likes: t.likeCount,
      weeklySaves: t.weeklySaves,
      badge: (t.badge === 'viral' ? 'trending' : t.badge === 'hot' ? 'trending' : undefined) as
        | 'trending'
        | 'new'
        | 'featured'
        | undefined,
      categories: t.categorySlug
        ? { slug: t.categorySlug, name: '', id: '', icon: '' }
        : undefined,
      creator: t.creator
        ? {
            id: t.creator.id,
            name: t.creator.name,
            username: t.creator.username,
            image: t.creator.image,
            curatorLevel: t.creator.curatorLevel ?? null,
          }
        : null,
    };
  };

  const mapRising = (r: (typeof risingResults)[0]): RisingListData => {
    const images = withCover({
      coverImage: r.coverImage,
      horizontalImage: r.horizontalImage,
      slug: r.slug,
      title: r.title,
      categorySlug: r.categorySlug,
    });
    return {
      id: r.listId,
      title: r.title,
      slug: r.slug,
      description: '',
      coverImage: images.coverImage,
      horizontalImage: r.horizontalImage,
      bannerImage: images.bannerImage,
      saveCount: r.saveCount,
      itemCount: r.itemCount,
      likes: r.likeCount,
      weeklySaves: r.weeklySaves,
      isFastRising: r.isFastRising ?? false,
      categories: r.categorySlug
        ? { slug: r.categorySlug, name: '', id: '', icon: '' }
        : undefined,
      creator: r.creator
        ? {
            id: r.creator.id,
            name: r.creator.name,
            username: r.creator.username,
            image: r.creator.image,
            curatorLevel: r.creator.curatorLevel ?? null,
          }
        : null,
    };
  };

  const mapFeatured: FeaturedListData | null = featured
    ? {
        ...mapList(featured as (typeof lists)[0]),
      }
    : null;

  return {
    featured: mapFeatured,
    featuredSlotId: slotList ? slotResult?.slotId ?? null : null,
    trending: dedupeListsById(trendingResults.map(mapTrending)),
    rising: dedupeListsById(risingResults.map(mapRising)),
    recommendations: visibleLists.slice(0, 4).map(mapList),
  };
  } catch (err) {
    console.warn('fetchHomePageData failed:', err);
    return EMPTY_HOME_DATA;
  }
}
