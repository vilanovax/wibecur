'use client';

import HomeSectionTitle from './HomeSectionTitle';
import HomeFeedGrid from './HomeFeedGrid';
import type { HomeGridListCardList } from './HomeGridListCard';
import { SAVED_LIST_BADGE } from './HomeGridListCard';
import {
  useForYouRecommendations,
  getForYouReasonLabel,
} from '@/hooks/useForYouRecommendations';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';
import { useHomeBookmarks, type HomeBookmarkList } from '@/hooks/useHomeBookmarks';
import { useLazyInView } from '@/hooks/useLazyInView';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';

function toGridList(list: HomeBookmarkList): HomeGridListCardList {
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
  const { ref, inView } = useLazyInView({ rootMargin: '240px' });
  const { hasSaves, isLoading: userLoading } = useHomeUserState();
  const { interests } = useHomeOnboardingInterests();
  const { lists: forYouLists, isPersonalized, isLoading: forYouLoading } =
    useForYouRecommendations({ enabled: inView });
  const { data: savedLists = [], isLoading: savedLoading } = useHomeBookmarks({
    enabled: inView && hasSaves,
  });

  if (userLoading || !hasSaves) return null;

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

  if (!inView) {
    return (
      <section ref={ref}>
        <HomeSectionTitle
          icon="✨"
          title="برای تو"
          subtitle={subtitle}
          actionHref="/lists"
          actionLabel="همه"
          analyticsSection="for_you"
        />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[16/10] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref}>
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
              if (savedIds.has(list.id)) return SAVED_LIST_BADGE;
              const forYou = forYouLists.find((l) => l.id === list.id);
              return forYou ? getForYouReasonLabel(forYou, isPersonalized) : null;
            }}
            getBadgeClassName={(list) =>
              savedIds.has(list.id) ? '' : 'bg-primary/90 text-white'
            }
            homeSection="for_you"
          />
        </div>
      )}
    </section>
  );
}
