'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard from './HomeGridListCard';
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

export default function ForYouSection({ embedded = false }: { embedded?: boolean }) {
  const { isGuest } = useHomeUserState();
  const { interests } = useHomeOnboardingInterests();
  const { data: homeData } = useHomeData();
  const { lists, isPersonalized, isLoading } = useForYouRecommendations();

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
      <section className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className="space-y-3 px-4 lg:px-0">
          {[1, 2].map((i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-lg bg-gray-100 lg:h-36" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={embedded ? '' : 'mb-6'}>
      {!embedded && (
        <HomeSectionTitle
          icon="✨"
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
            <p className="mb-3 px-4 wibe-caption text-wibe-secondary lg:px-0">
              هنوز ذخیره‌ای نداری — این لیست‌های محبوب را امتحان کن
            </p>
          ) : null}

          <div className="space-y-2 px-4 lg:hidden">
            {displayLists.map((list) => {
              const reason = getForYouReasonLabel(list, isPersonalized);
              return (
                <Link
                  key={list.id}
                  href={`/lists/${list.slug}`}
                  onClick={() =>
                    trackHomeSectionClick('for_you', {
                      list_slug: list.slug,
                      category_slug: list.categories?.slug,
                      target: 'card',
                    })
                  }
                  className="flex min-h-[120px] flex-row-reverse gap-4 overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-gray-200">
                    <ImageWithFallback
                      src={list.coverImage}
                      alt={list.title}
                      className="h-full w-full object-cover"
                      fallbackIcon={list.categories?.icon ?? '📋'}
                      fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200"
                      categorySlug={list.categories?.slug}
                      listSlug={list.slug}
                      listTitle={list.title}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                      aria-hidden
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pl-2 pr-3">
                    {reason ? (
                      <p className="mb-1 wibe-caption font-medium text-primary">{reason}</p>
                    ) : null}
                    <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                      {list.title}
                    </h3>
                    {list.itemCount > 0 ? (
                      <p className="mt-1.5 wibe-caption text-wibe-secondary">
                        {list.itemCount.toLocaleString('fa-IR')} آیتم
                      </p>
                    ) : null}
                  </div>
                </Link>
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
              badgeClassName="bg-primary/90 text-white"
              homeSection="for_you"
            />
          </div>
        </>
      )}
    </section>
  );
}
