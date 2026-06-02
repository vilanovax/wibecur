'use client';

import { useHomeData } from '@/contexts/HomeDataContext';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard from './HomeGridListCard';

const MOBILE_CARD_WIDTH = 160;
const MOBILE_CARD_HEIGHT = Math.round(MOBILE_CARD_WIDTH * (183 / 136));

interface TrendingThisWeekCarouselProps {
  /** داخل HomeFeedTabs — بدون عنوان بخش */
  embedded?: boolean;
}

export default function TrendingThisWeekCarousel({ embedded = false }: TrendingThisWeekCarouselProps) {
  const { data, isLoading } = useHomeData();
  const limit = embedded ? 10 : 6;
  const lists = (data?.trending ?? []).slice(0, limit);

  if (isLoading && lists.length === 0) {
    return (
      <section className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4 lg:px-0">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className="flex gap-2.5 overflow-hidden px-4 lg:grid lg:grid-cols-3 lg:gap-3 lg:px-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 animate-pulse rounded-lg bg-gray-100 lg:w-full"
              style={{ width: MOBILE_CARD_WIDTH, height: MOBILE_CARD_HEIGHT }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) {
    return embedded ? (
      <p className="px-4 py-6 text-center wibe-small text-wibe-secondary lg:px-0">
        فعلاً لیست ترندی نیست
      </p>
    ) : null;
  }

  return (
    <section className={embedded ? 'overflow-x-hidden' : 'mb-6 overflow-x-hidden'}>
      {!embedded && (
        <HomeSectionTitle
          icon="🔥"
          title="ترند این هفته"
          subtitle="بر اساس ذخیره و تعامل"
          actionHref="/lists?mode=trending"
          actionLabel="همه"
        />
      )}
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-0.5 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-3 lg:overflow-visible lg:snap-none lg:px-0">
        {lists.map((list) => (
          <HomeGridListCard key={list.id} list={list} badge="ترند" badgeClassName="bg-warning text-white" />
        ))}
      </div>
    </section>
  );
}
