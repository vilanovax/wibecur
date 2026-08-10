'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import TrendingThisWeekCarousel from './TrendingThisWeekCarousel';
import { HomeFeedSectionSkeleton } from './home-section-skeletons';
import {
  fetchForYouRecommendations,
  forYouQueryKey,
} from '@/hooks/useForYouRecommendations';
import { useHomeOnboardingInterests } from '@/hooks/useHomeOnboardingInterests';
import { useHomeUserState } from '@/hooks/useHomeUserState';
import { trackHomeTabSwitch } from '@/lib/analytics';

const ForYouSection = dynamic(() => import('./ForYouSection'), {
  loading: () => <HomeFeedSectionSkeleton titleWidth="w-32" />,
});

type FeedTab = 'trending' | 'foryou';

const TAB_SEE_ALL: Record<FeedTab, { href: string; label: string }> = {
  trending: { href: '/lists?mode=trending', label: 'همه ترندها' },
  foryou: { href: '/lists', label: 'همه پیشنهادها' },
};

export default function HomeFeedTabs() {
  const [tab, setTab] = useState<FeedTab>('trending');
  const { data: session } = useSession();
  const { interests } = useHomeOnboardingInterests();
  const { isNewUser, isGuest } = useHomeUserState();
  const queryClient = useQueryClient();

  const tabs = useMemo(() => {
    const base: { id: FeedTab; label: string; ariaLabel: string }[] = [
      { id: 'trending', label: 'ترند', ariaLabel: 'ترند این هفته' },
    ];
    if (!isGuest) {
      base.push({ id: 'foryou', label: 'برای تو', ariaLabel: 'پیشنهاد برای تو' });
    }
    return base;
  }, [isGuest]);

  useEffect(() => {
    if (isGuest && tab === 'foryou') setTab('trending');
  }, [isGuest, tab]);

  const prefetchForYou = useCallback(() => {
    if (isGuest) return;
    void queryClient.prefetchQuery({
      queryKey: forYouQueryKey(session?.user?.id, interests),
      queryFn: () => fetchForYouRecommendations(interests),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, session?.user?.id, interests, isGuest]);

  const seeAll = TAB_SEE_ALL[tab];
  const showTablist = tabs.length > 1;

  return (
    <section className="mb-4 lg:mb-0" aria-label="فید کشف">
      <div className="mb-3 space-y-2.5 px-4 lg:mb-0 lg:border-b lg:border-wibe/60 lg:px-5 lg:pb-4 lg:pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:shrink-0">
            {showTablist ? (
              <div className="flex min-w-0 flex-wrap gap-2" role="tablist" aria-label="نوع فید">
                {tabs.map((item) => {
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
                      onClick={() => {
                        if (!isActive) trackHomeTabSwitch(item.id);
                        setTab(item.id);
                      }}
                      onPointerEnter={item.id === 'foryou' ? prefetchForYou : undefined}
                      onTouchStart={item.id === 'foryou' ? prefetchForYou : undefined}
                      className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-4 wibe-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:h-8 lg:px-3.5 ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'border border-wibe bg-wibe-card text-foreground hover:border-primary/30'
                      }`}
                    >
                      {item.id === 'trending' && isNewUser && !isGuest ? (
                        <span
                          className={`rounded-pill px-1.5 py-0.5 wibe-caption font-bold leading-none ${
                            isActive ? 'bg-white/20 text-white' : 'bg-amber-400/20 text-amber-700'
                          }`}
                        >
                          شروع
                        </span>
                      ) : null}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <h2 className="wibe-h3 text-foreground">ترند این هفته</h2>
            )}
          </div>

          <div className="flex min-w-0 flex-1 justify-end lg:gap-4">
            <Link
              href={seeAll.href}
              className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg px-2 wibe-caption font-semibold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:min-h-0 lg:px-0"
            >
              {seeAll.label}
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {tab === 'foryou' && isNewUser && !isGuest && (
        <div className="mx-4 mb-3 rounded-xl border border-wibe bg-wibe-surface px-3 py-2.5 lg:mx-0">
          <p className="wibe-caption text-wibe-secondary">
            از تب ترند چند لیست ذخیره کن — پیشنهادهای این بخش دقیق‌تر می‌شوند.
          </p>
        </div>
      )}

      <div
        role={showTablist ? 'tabpanel' : undefined}
        id={showTablist ? `feed-panel-${tab}` : undefined}
        aria-labelledby={showTablist ? `feed-tab-${tab}` : undefined}
        className="lg:px-5 lg:pb-5 lg:pt-1"
      >
        {tab === 'trending' && <TrendingThisWeekCarousel embedded />}
        {tab === 'foryou' && !isGuest && <ForYouSection embedded fetchEnabled />}
      </div>
    </section>
  );
}
