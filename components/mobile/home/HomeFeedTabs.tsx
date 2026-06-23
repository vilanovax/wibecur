'use client';

import { useCallback, useState } from 'react';
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

const TABS: { id: FeedTab; label: string; ariaLabel: string }[] = [
  { id: 'trending', label: 'ترند', ariaLabel: 'ترند این هفته' },
  { id: 'foryou', label: 'برای تو', ariaLabel: 'پیشنهاد برای تو' },
];

const TAB_META: Record<FeedTab, { subtitle: string; seeAllHref: string }> = {
  trending: {
    subtitle: 'بر اساس ذخیره و تعامل',
    seeAllHref: '/lists?mode=trending',
  },
  foryou: {
    subtitle: 'پیشنهاد برای شروع',
    seeAllHref: '/lists',
  },
};

export default function HomeFeedTabs() {
  const [tab, setTab] = useState<FeedTab>('trending');
  const { data: session } = useSession();
  const { interests, shouldShowStartStrip } = useHomeOnboardingInterests();
  const { isNewUser, isGuest } = useHomeUserState();
  const queryClient = useQueryClient();

  const meta = {
    ...TAB_META[tab],
    subtitle:
      tab === 'foryou' && isNewUser
        ? isGuest
          ? 'کاوش عمومی — با ورود شخصی‌تر می‌شود'
          : 'پیشنهاد برای شروع — با ذخیره دقیق‌تر می‌شود'
        : tab === 'foryou' && !isNewUser
          ? 'بر اساس ذخیره‌ها و علایق تو'
          : TAB_META[tab].subtitle,
  };

  const prefetchForYou = useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: forYouQueryKey(session?.user?.id, interests),
      queryFn: () => fetchForYouRecommendations(interests),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, session?.user?.id, interests]);

  return (
    <section className="mb-4 lg:mb-0" aria-label="فید کشف">
      <div className="mb-3 space-y-2.5 px-4 lg:mb-0 lg:border-b lg:border-wibe/60 lg:px-5 lg:pb-4 lg:pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="flex min-w-0 flex-wrap gap-2 lg:shrink-0" role="tablist" aria-label="نوع فید">
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
                  onClick={() => {
                    if (!isActive) trackHomeTabSwitch(item.id);
                    setTab(item.id);
                  }}
                  onPointerEnter={item.id === 'foryou' ? prefetchForYou : undefined}
                  onTouchStart={item.id === 'foryou' ? prefetchForYou : undefined}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 wibe-small font-medium transition-all lg:h-8 lg:px-3.5 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-wibe bg-wibe-card text-foreground hover:border-primary/30'
                  }`}
                >
                  {item.id === 'trending' && isNewUser ? (
                    <span
                      className={`rounded-pill px-1.5 py-0.5 text-[10px] font-bold leading-none ${
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

          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 lg:justify-end lg:gap-4">
            <p className="wibe-small font-medium text-foreground">{meta.subtitle}</p>
            <Link
              href={meta.seeAllHref}
              className="inline-flex shrink-0 items-center gap-0.5 wibe-caption font-semibold text-primary hover:underline"
            >
              مشاهده همه
              <ChevronLeft className="h-3.5 w-3.5 rotate-180" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {tab === 'foryou' && isGuest && !shouldShowStartStrip && (
        <div className="mx-4 mb-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5 lg:mx-0">
          <p className="wibe-caption text-wibe-secondary">
            برای پیشنهادهای شخصی‌تر{' '}
            <Link href="/login?callbackUrl=%2F&source=login_banner" className="font-semibold text-primary hover:underline">
              وارد شو
            </Link>
          </p>
        </div>
      )}

      {tab === 'foryou' && isNewUser && !isGuest && (
        <div className="mx-4 mb-3 rounded-xl border border-wibe bg-wibe-surface px-3 py-2.5 lg:mx-0">
          <p className="wibe-caption text-wibe-secondary">
            از تب ترند چند لیست ذخیره کن — پیشنهادهای این بخش دقیق‌تر می‌شوند.
          </p>
        </div>
      )}

      <div
        role="tabpanel"
        id={`feed-panel-${tab}`}
        aria-labelledby={`feed-tab-${tab}`}
        className="lg:px-5 lg:pb-5 lg:pt-1"
      >
        {tab === 'trending' && <TrendingThisWeekCarousel embedded />}
        {tab === 'foryou' && <ForYouSection embedded fetchEnabled />}
      </div>
    </section>
  );
}
