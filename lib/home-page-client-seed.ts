import type {
  FeaturedListData,
  HomeData,
  HomeListData,
  RisingListData,
} from '@/types/home-data';

/** Card fields used by home carousels/mood — no description or hero image variants. */
function slimListCard(list: HomeListData): HomeListData {
  return {
    id: list.id,
    title: list.title,
    slug: list.slug,
    description: '',
    coverImage: list.coverImage,
    saveCount: list.saveCount,
    itemCount: list.itemCount,
    likes: list.likes,
    weeklySaves: list.weeklySaves,
    badge: list.badge,
    categories: list.categories
      ? {
          id: list.categories.id,
          name: list.categories.name,
          slug: list.categories.slug,
          icon: list.categories.icon,
        }
      : null,
    creator: list.creator
      ? {
          id: list.creator.id,
          name: list.creator.name,
          username: list.creator.username,
          image: list.creator.image,
          curatorLevel: list.creator.curatorLevel,
        }
      : null,
  };
}

function slimRisingCard(list: RisingListData): RisingListData {
  return {
    ...slimListCard(list),
    isFastRising: list.isFastRising,
  };
}

/** Id stub for featured compare — full hero is RSC, not re-serialized here. */
function slimFeaturedStub(list: FeaturedListData): FeaturedListData {
  return {
    id: list.id,
    title: '',
    slug: '',
    description: '',
    coverImage: '',
    saveCount: 0,
    itemCount: 0,
    likes: 0,
  };
}

/**
 * When RSC already renders hero (+ desktop trending), don't also ship full featured
 * / hero image fields into the client provider seed (server-dedup-props).
 * Keep slim trending/rising/recommendations for mobile carousels + mood.
 */
export function toHomeClientSeed(data: HomeData): HomeData {
  return {
    featured: data.featured ? slimFeaturedStub(data.featured) : null,
    featuredSlotId: data.featuredSlotId,
    trending: data.trending.map(slimListCard),
    rising: data.rising.map(slimRisingCard),
    recommendations: data.recommendations.map(slimListCard),
  };
}
