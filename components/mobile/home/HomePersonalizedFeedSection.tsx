'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import HomeSectionTitle from './HomeSectionTitle';
import HomeFeedGrid from './HomeFeedGrid';
import type { HomeGridListCardList } from './HomeGridListCard';
import {
  useForYouRecommendations,
  getForYouReasonLabel,
} from '@/hooks/useForYouRecommendations';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';

type BookmarkList = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount?: number;
  categories?: { slug?: string; icon?: string | null } | null;
};

async function fetchRecentBookmarks(): Promise<BookmarkList[]> {
  const res = await fetch('/api/user/bookmarks?page=1&limit=6');
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  const items = json.data?.bookmarks ?? [];
  return items.map((b: { list: BookmarkList }) => b.list).filter(Boolean);
}

function toGridList(list: BookmarkList): HomeGridListCardList {
  return {
    id: list.id,
    title: list.title,
    slug: list.slug,
    coverImage: list.coverImage ?? '',
    saveCount: list.saveCount ?? 0,
    categories: list.categories,
  };
}

/** دسکتاپ: ادغام ذخیره‌شده‌ها + برای تو در یک گرید */
export default function HomePersonalizedFeedSection() {
  const { data: session, status } = useSession();
  const { hasSaves, isLoading: userLoading } = useHomeUserState();
  const { interests } = useHomeOnboardingInterests();
  const { lists: forYouLists, isPersonalized, isLoading: forYouLoading } =
    useForYouRecommendations();

  const { data: savedLists = [], isLoading: savedLoading } = useQuery({
    queryKey: ['user', session?.user?.id, 'home-bookmarks-combined'],
    queryFn: fetchRecentBookmarks,
    enabled: status !== 'loading' && !!session?.user?.id && hasSaves,
    staleTime: 60_000,
  });

  if (status === 'loading' || userLoading || !hasSaves) return null;

  const isLoading = savedLoading || forYouLoading;
  const savedIds = new Set(savedLists.map((l) => l.id));
  const savedMapped = savedLists.slice(0, 4).map(toGridList);
  const forYouMapped = forYouLists
    .filter((l) => !savedIds.has(l.id))
    .slice(0, Math.max(0, 8 - savedMapped.length))
    .map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      coverImage: l.coverImage,
      saveCount: l.saveCount,
      weeklySaves: l.weeklySaves,
      categories: l.categories,
      creator: l.creator,
    }));

  const combined: HomeGridListCardList[] = [...savedMapped, ...forYouMapped];
  const cells = buildDesktopFeedCells(combined, {
    maxLists: 8,
    seeAll: {
      href: '/lists',
      label: 'مشاهده همه',
      description: 'پیشنهادهای بیشتر',
    },
  });

  const subtitle = isPersonalized
    ? 'ادامه از ذخیره‌هایت + پیشنهادهای شخصی'
    : interests.length > 0
      ? 'ذخیره‌هایت + بر اساس علاقه‌مندی‌ها'
      : 'ذخیره‌هایت + پیشنهاد برای ادامه';

  return (
    <section className="hidden lg:block">
      <HomeSectionTitle
        icon="✨"
        title="برای تو"
        subtitle={subtitle}
        actionHref="/lists"
        actionLabel="همه"
        analyticsSection="for_you"
      />

      {isLoading && combined.length === 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[16/10] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className={HOME_FEED_GRID_CLASS}>
          <HomeFeedGrid
            cells={cells}
            getBadge={(list) => {
              if (savedIds.has(list.id)) return 'ذخیره‌شده';
              const forYou = forYouLists.find((l) => l.id === list.id);
              return forYou ? getForYouReasonLabel(forYou, isPersonalized) : null;
            }}
            getBadgeClassName={(list) =>
              savedIds.has(list.id) ? 'bg-emerald-600/90 text-white' : 'bg-primary/90 text-white'
            }
            homeSection="for_you"
          />
        </div>
      )}
    </section>
  );
}
