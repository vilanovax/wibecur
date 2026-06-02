'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import type { SimilarItem, TrendingItem, AlsoLikedItem } from '@/types/items';

type DiscoveryTab = 'similar' | 'saves' | 'trending';

const TAB_ACTIVE =
  'bg-primary text-white shadow-sm ring-1 ring-primary/20';
const TAB_INACTIVE =
  'bg-gray-100 text-gray-600 hover:bg-gray-200/90 hover:text-gray-800';

const DISCOVERY_ROW_CLASS =
  'flex gap-3 overflow-x-auto overflow-y-hidden pb-1 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:snap-none xl:grid-cols-5';

const DISCOVERY_TRENDING_ROW_CLASS =
  'flex gap-2.5 overflow-x-auto overflow-y-hidden pb-1 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible lg:snap-none';

function displayRating(rating: number | null | undefined): string | null {
  if (rating == null || Number(rating) === 0) return null;
  return String(rating);
}

function DiscoveryCarouselCard({
  href,
  itemId,
  title,
  imageUrl,
  categorySlug,
  fallbackIcon,
  rating,
  subtitle,
  className = 'flex-shrink-0 w-[calc(52vw)] max-w-[210px] lg:w-full lg:max-w-none lg:flex-shrink',
  rank,
}: {
  href: string;
  itemId: string;
  title: string;
  imageUrl: string | null;
  categorySlug?: string | null;
  fallbackIcon?: string;
  rating?: number | null;
  subtitle?: string;
  className?: string;
  rank?: number;
}) {
  const ratingLabel = displayRating(rating ?? null);

  return (
    <Link
      href={href}
      className={`${className} rounded-xl overflow-hidden border border-wibe shadow-sm active:scale-[0.99] transition-transform bg-wibe-card`}
    >
      <div className="relative aspect-[2/3] w-full bg-gray-100 lg:aspect-[16/10] lg:max-h-[9.5rem]">
        <LazyItemCoverImage
          itemId={itemId}
          title={title}
          imageUrl={imageUrl}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon ?? '📋'}
          className="absolute inset-0 w-full h-full object-cover"
          fallbackClassName="absolute inset-0 w-full h-full"
          coverLayout="grid"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        {rank != null && rank <= 3 && (
          <span className="absolute top-2 right-2 wibe-caption bg-warning text-white px-1.5 py-0.5 rounded-pill font-medium shadow-sm">
            #{rank.toLocaleString('fa-IR')}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
          <h3 className="wibe-small font-semibold leading-snug line-clamp-2 drop-shadow-sm">{title}</h3>
          {(ratingLabel || subtitle) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 wibe-caption text-white/90">
              {ratingLabel && (
                <span className="flex items-center gap-0.5">
                  <span>⭐</span>
                  <span>{ratingLabel}</span>
                </span>
              )}
              {subtitle && <span className="line-clamp-1 opacity-90">{subtitle}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function CarouselSkeleton({
  count = 3,
  className = 'min-w-[calc(52vw)] w-[calc(52vw)] max-w-[210px] aspect-[2/3] lg:w-full lg:min-w-0 lg:max-w-none',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className="flex gap-3 overflow-hidden -mx-4 px-4 pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${className} flex-shrink-0 rounded-xl bg-gray-200 animate-pulse`} />
      ))}
    </div>
  );
}

interface ItemDiscoverySectionProps {
  categorySlug?: string | null;
  similarItems: SimilarItem[];
  similarLoading: boolean;
  alsoLikedItems: AlsoLikedItem[];
  alsoLikedLoading: boolean;
  trendingItems: TrendingItem[];
  trendingLoading: boolean;
}

export default function ItemDiscoverySection({
  categorySlug,
  similarItems,
  similarLoading,
  alsoLikedItems,
  alsoLikedLoading,
  trendingItems,
  trendingLoading,
}: ItemDiscoverySectionProps) {
  const hasSimilar = similarItems.length >= 2;
  const hasSaves = alsoLikedItems.length > 0;
  const hasTrending = trendingItems.length > 0;

  const availableTabs = useMemo(() => {
    const tabs: { id: DiscoveryTab; label: string }[] = [];
    if (hasSimilar || similarLoading) tabs.push({ id: 'similar', label: 'مشابه' });
    if (hasSaves) tabs.push({ id: 'saves', label: 'بر اساس ذخیره' });
    if (hasTrending || trendingLoading) tabs.push({ id: 'trending', label: 'داغ' });
    return tabs;
  }, [hasSimilar, hasSaves, hasTrending, similarLoading, trendingLoading]);

  const [activeTab, setActiveTab] = useState<DiscoveryTab>('similar');

  useEffect(() => {
    if (availableTabs.length === 0) return;
    if (availableTabs.some((t) => t.id === activeTab)) return;
    setActiveTab(availableTabs[0].id);
  }, [availableTabs, activeTab]);

  const isLoading =
    (activeTab === 'similar' && similarLoading) ||
    (activeTab === 'saves' && alsoLikedLoading) ||
    (activeTab === 'trending' && trendingLoading);

  const showSection =
    similarLoading ||
    alsoLikedLoading ||
    trendingLoading ||
    hasSimilar ||
    hasSaves ||
    hasTrending;

  if (!showSection) return null;

  const tabDescriptions: Record<DiscoveryTab, string> = {
    similar: 'بر اساس ژانر و حال‌وهوا',
    saves: 'کاربرانی که این را ذخیره کردند',
    trending: 'پرطرفدارهای این دسته',
  };

  return (
    <section className="border-t border-wibe pt-4 lg:rounded-2xl lg:border lg:bg-wibe-card lg:p-5 lg:pt-5 lg:shadow-sm">
      <div className="mb-3">
        <h2 className="wibe-h3 text-foreground">پیشنهاد برای تو</h2>
        <p className="wibe-caption text-wibe-secondary mt-0.5">{tabDescriptions[activeTab]}</p>
      </div>

      {availableTabs.length > 1 && (
        <div
          className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-0.5"
          role="tablist"
          aria-label="نوع پیشنهاد"
        >
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.98] ${
                activeTab === tab.id ? TAB_ACTIVE : TAB_INACTIVE
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <CarouselSkeleton count={activeTab === 'trending' ? 4 : 3} />
      ) : activeTab === 'similar' && hasSimilar ? (
        <div className={DISCOVERY_ROW_CLASS}>
          {similarItems.map((s) => (
            <DiscoveryCarouselCard
              key={s.id}
              href={`/items/${s.id}`}
              itemId={s.id}
              title={s.title}
              imageUrl={s.image}
              categorySlug={categorySlug}
              fallbackIcon={s.category?.icon ?? undefined}
              rating={s.rating}
              subtitle={s.category?.name ?? undefined}
              className="flex-shrink-0 w-[calc(52vw)] max-w-[210px] snap-start lg:w-full lg:max-w-none"
            />
          ))}
        </div>
      ) : activeTab === 'saves' && hasSaves ? (
        <div className={DISCOVERY_ROW_CLASS}>
          {alsoLikedItems.map((a) => (
            <DiscoveryCarouselCard
              key={a.id}
              href={`/items/${a.id}`}
              itemId={a.id}
              title={a.title}
              imageUrl={a.image}
              categorySlug={categorySlug}
              rating={a.rating}
              subtitle={`${a.commonUsersCount.toLocaleString('fa-IR')} نفر همراه`}
              className="flex-shrink-0 w-[calc(48vw)] max-w-[200px] snap-start lg:w-full lg:max-w-none"
            />
          ))}
        </div>
      ) : activeTab === 'trending' && hasTrending ? (
        <div className={DISCOVERY_TRENDING_ROW_CLASS}>
          {trendingItems.slice(0, 8).map((t, index) => (
            <DiscoveryCarouselCard
              key={t.id}
              href={`/items/${t.id}`}
              itemId={t.id}
              title={t.title}
              imageUrl={t.image}
              categorySlug={categorySlug}
              rating={t.rating}
              rank={index + 1}
              className="flex-shrink-0 w-[108px] max-w-[108px] snap-start lg:w-full lg:max-w-none"
            />
          ))}
        </div>
      ) : (
        <div className="py-6 px-4 rounded-xl bg-gray-50 border border-wibe/80 text-center">
          <p className="wibe-small text-wibe-secondary">فعلاً پیشنهادی برای این بخش نداریم</p>
        </div>
      )}
    </section>
  );
}
