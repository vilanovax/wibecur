'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard from './HomeGridListCard';
import HomeListSaveControl from './HomeListSaveControl';
import HomeStarterEmptyPanel from './HomeStarterEmptyPanel';
import HomeFeedGrid from './HomeFeedGrid';
import {
  useForYouRecommendations,
  getForYouReasonLabel,
} from '@/hooks/useForYouRecommendations';
import { useHomeData } from '@/contexts/HomeDataContext';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import { buildDesktopFeedCells } from '@/lib/home-feed-grid';
import { trackHomeSectionClick } from '@/lib/analytics';
import { useLazyInView } from '@/hooks/useLazyInView';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ForYouSectionProps = {
  embedded?: boolean;
  /** وقتی embedded است، والد تعیین می‌کند API چه موقع fetch شود */
  fetchEnabled?: boolean;
};

export default function ForYouSection({ embedded = false, fetchEnabled: fetchEnabledProp }: ForYouSectionProps) {
  const { ref, inView } = useLazyInView({ rootMargin: '240px' });
  // Explicit fetchEnabled wins (eager home mount); else embedded waits for prop, standalone waits for inView.
  const shouldFetch =
    typeof fetchEnabledProp === 'boolean'
      ? fetchEnabledProp
      : embedded
        ? false
        : inView;

  const { isGuest } = useHomeUserState();
  const { interests } = useHomeOnboardingInterests();
  const { data: homeData } = useHomeData();
  const { lists, isPersonalized, isLoading } = useForYouRecommendations({ enabled: shouldFetch });

  const trendingFallback = (homeData?.trending ?? []).filter(
    (l) => l.id !== homeData?.featured?.id
  );
  const displayLists = (lists.length > 0 ? lists : trendingFallback).slice(0, 8);
  const desktopCells = buildDesktopFeedCells(displayLists, {
    maxLists: 8,
    seeAll: {
      href: '/lists',
      label: 'مشاهده همه',
      description: 'پیشنهادهای بیشتر',
    },
  });
  const usingFallback = !isPersonalized && lists.length === 0 && displayLists.length > 0;
  const trulyEmpty = displayLists.length === 0;

  const subtitle = isPersonalized
    ? 'بر اساس ذخیره‌ها و علایق تو'
    : interests.length > 0
      ? 'بر اساس علاقه‌مندی‌های انتخاب‌شده'
      : 'لیست‌های پیشنهادی برای شروع';

  if (isLoading && displayLists.length === 0) {
    return (
      <section ref={ref} className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4">
            <Skeleton className="h-6 w-32" />
          </div>
        )}
        <div className="space-y-3 px-4 lg:px-0">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl lg:h-36" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={embedded ? '' : 'mb-6'}>
      {!embedded && (
        <HomeSectionTitle
          iconVariant="forYou"
          title={isPersonalized ? 'برای تو' : 'پیشنهاد برای شروع'}
          subtitle={subtitle}
          actionHref="/lists"
          actionLabel="همه"
          analyticsSection="for_you"
        />
      )}

      {trulyEmpty ? (
        <HomeStarterEmptyPanel lists={trendingFallback.slice(0, 4)} isGuest={isGuest} />
      ) : (
        <>
          {usingFallback && !embedded ? (
            <p className="mb-3 px-4 wibe-caption text-muted-foreground lg:px-0">
              هنوز ذخیره‌ای نداری — این لیست‌های محبوب را امتحان کن
            </p>
          ) : null}

          <div className="space-y-2 px-4 lg:hidden">
            {displayLists.map((list) => {
              const reason = getForYouReasonLabel(list, isPersonalized);
              return (
                <Card
                  key={list.id}
                  className="relative overflow-hidden bg-popover p-0 transition-transform active:scale-95"
                >
                  <Link
                    href={`/lists/${list.slug}`}
                    onClick={() =>
                      trackHomeSectionClick('for_you', {
                        list_slug: list.slug,
                        category_slug: list.categories?.slug,
                        target: 'card',
                      })
                    }
                    className="flex min-h-32 gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
                  >
                    <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pe-2 ps-3">
                      {reason ? (
                        <p className="mb-1 text-xs font-medium text-brand">{reason}</p>
                      ) : null}
                      <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                        {list.title}
                      </h3>
                      {list.itemCount > 0 ? (
                        <p className="mt-1.5 wibe-caption text-muted-foreground">
                          {list.itemCount.toLocaleString('fa-IR')} آیتم
                        </p>
                      ) : null}
                    </div>
                    <div className="relative size-28 shrink-0 overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={list.coverImage}
                        alt={list.title}
                        className="h-full w-full object-cover"
                        fallbackIcon={list.categories?.icon ?? '📋'}
                        fallbackClassName="flex h-full w-full items-center justify-center bg-muted"
                        categorySlug={list.categories?.slug}
                        listSlug={list.slug}
                        listTitle={list.title}
                      />
                      <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                        aria-hidden
                      />
                    </div>
                  </Link>
                  <div className="absolute end-1 top-1 z-10">
                    <HomeListSaveControl
                      listId={list.id}
                      listSlug={list.slug}
                      categorySlug={list.categories?.slug}
                      saveCount={list.saveCount}
                      size="compact"
                      analyticsSource="home_for_you"
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          <div
            className={`hidden lg:grid lg:overflow-visible lg:snap-none lg:px-0 ${HOME_FEED_GRID_CLASS}`}
          >
            <HomeFeedGrid
              cells={desktopCells}
              getBadge={(list) => {
                const full = lists.find((l) => l.id === list.id) ?? list;
                return (
                  getForYouReasonLabel(full as Parameters<typeof getForYouReasonLabel>[0], isPersonalized) ||
                  (usingFallback ? 'پیشنهاد شروع' : null)
                );
              }}
              badgeClassName="bg-brand text-brand-foreground"
              homeSection="for_you"
            />
          </div>
        </>
      )}
    </section>
  );
}
