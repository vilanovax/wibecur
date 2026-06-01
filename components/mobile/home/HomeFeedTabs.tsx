'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import TrendingThisWeekCarousel from './TrendingThisWeekCarousel';
import ForYouSection from './ForYouSection';
import NewAndRisingSection from './NewAndRisingSection';
import {
  fetchForYouRecommendations,
  forYouQueryKey,
} from '@/hooks/useForYouRecommendations';

type FeedTab = 'trending' | 'foryou' | 'rising';

const TABS: { id: FeedTab; label: string; ariaLabel: string }[] = [
  { id: 'trending', label: 'ترند', ariaLabel: 'ترند این هفته' },
  { id: 'foryou', label: 'برای تو', ariaLabel: 'پیشنهاد برای تو' },
  { id: 'rising', label: 'اوج', ariaLabel: 'در حال اوج گرفتن' },
];

const TAB_META: Record<
  FeedTab,
  { subtitle: string; seeAllHref: string }
> = {
  trending: {
    subtitle: 'بر اساس ذخیره و تعامل',
    seeAllHref: '/lists?mode=trending',
  },
  foryou: {
    subtitle: 'لیست‌های پیشنهادی',
    seeAllHref: '/lists',
  },
  rising: {
    subtitle: 'رشد سریع ذخیره در ۲۴ ساعت اخیر',
    seeAllHref: '/lists?mode=popular',
  },
};

export default function HomeFeedTabs() {
  const [tab, setTab] = useState<FeedTab>('trending');
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const meta = TAB_META[tab];
  const subtitle = meta.subtitle;

  const prefetchForYou = useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: forYouQueryKey(session?.user?.id),
      queryFn: fetchForYouRecommendations,
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, session?.user?.id]);

  return (
    <section className="mb-6" aria-label="فید کشف">
      <div className="mb-2 flex items-center justify-between gap-3 px-4 lg:px-0">
        <div
          className="flex min-w-0 flex-1 gap-2"
          role="tablist"
          aria-label="نوع فید"
        >
          {TABS.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`feed-tab-${item.id}`}
                aria-selected={isActive}
                aria-controls={`feed-panel-${item.id}`}
                aria-label={item.ariaLabel}
                onClick={() => setTab(item.id)}
                onPointerEnter={item.id === 'foryou' ? prefetchForYou : undefined}
                onTouchStart={item.id === 'foryou' ? prefetchForYou : undefined}
                className={`h-9 shrink-0 rounded-lg px-4 wibe-small font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-wibe bg-wibe-card text-foreground hover:border-primary/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <Link
          href={meta.seeAllHref}
          className="shrink-0 wibe-caption font-medium text-primary hover:underline"
        >
          همه
        </Link>
      </div>

      <p className="mb-3 px-4 wibe-small text-wibe-secondary lg:px-0">{subtitle}</p>

      {tab === 'foryou' && !session?.user && (
        <div className="mx-4 mb-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
          <p className="wibe-caption text-wibe-secondary">
            برای پیشنهادهای شخصی‌تر{' '}
            <Link href="/login?callbackUrl=/" className="font-semibold text-primary hover:underline">
              وارد شو
            </Link>
          </p>
        </div>
      )}

      <div
        role="tabpanel"
        id={`feed-panel-${tab}`}
        aria-labelledby={`feed-tab-${tab}`}
      >
        {tab === 'trending' && <TrendingThisWeekCarousel embedded />}
        {tab === 'foryou' && <ForYouSection embedded />}
        {tab === 'rising' && <NewAndRisingSection embedded />}
      </div>
    </section>
  );
}
