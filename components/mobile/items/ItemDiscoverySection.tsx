'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import type { SimilarItem, TrendingItem, AlsoLikedItem } from '@/types/items';

type DiscoveryTab = 'similar' | 'saves' | 'trending';

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
  className = 'flex-shrink-0 w-[calc(55vw)] max-w-[220px]',
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
      className={`${className} rounded-lg overflow-hidden border border-wibe shadow-sm active:scale-[0.99] transition-transform bg-wibe-card`}
    >
      <div className="relative aspect-[2/3] w-full bg-gray-100">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {rank != null && rank <= 3 && (
          <span className="absolute top-1.5 right-1.5 wibe-caption bg-warning text-white px-1.5 py-0.5 rounded-pill">
            #{rank.toLocaleString('fa-IR')}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
          <h3 className="wibe-small font-semibold leading-snug line-clamp-2 drop-shadow">{title}</h3>
          {(ratingLabel || subtitle) && (
            <div className="flex flex-wrap items-center gap-2 mt-1 wibe-caption text-white/90">
              {ratingLabel && (
                <span className="flex items-center gap-0.5">
                  <span>⭐</span>
                  <span>{ratingLabel}</span>
                </span>
              )}
              {subtitle && <span className="line-clamp-1">{subtitle}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function CarouselSkeleton({ count = 3, className = 'min-w-[calc(55vw)] w-[calc(55vw)] max-w-[220px] h-[calc(55vw*1.5)] max-h-[330px]' }) {
  return (
    <div className="flex gap-3 overflow-hidden -mx-4 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${className} flex-shrink-0 rounded-lg bg-gray-200 animate-pulse`} />
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
    if (hasSaves || alsoLikedLoading) tabs.push({ id: 'saves', label: 'بر اساس ذخیره' });
    if (hasTrending || trendingLoading) tabs.push({ id: 'trending', label: 'داغ' });
    return tabs;
  }, [hasSimilar, hasSaves, hasTrending, similarLoading, alsoLikedLoading, trendingLoading]);

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
    <section className="-mx-4 px-4">
      <h2 className="wibe-h3 mb-0.5">پیشنهاد برای تو</h2>
      <p className="wibe-caption text-wibe-secondary mb-3">{tabDescriptions[activeTab]}</p>

      {availableTabs.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-0.5">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg wibe-caption font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide">
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
            />
          ))}
        </div>
      ) : activeTab === 'saves' && hasSaves ? (
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide">
          {alsoLikedItems.map((a) => (
            <DiscoveryCarouselCard
              key={a.id}
              href={`/items/${a.id}`}
              itemId={a.id}
              title={a.title}
              imageUrl={a.image}
              categorySlug={categorySlug}
              rating={a.rating}
              subtitle={`${a.commonUsersCount.toLocaleString('fa-IR')} نفر همراه ذخیره کردند`}
              className="flex-shrink-0 w-[calc(48vw)] max-w-[200px]"
            />
          ))}
        </div>
      ) : activeTab === 'trending' && hasTrending ? (
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 scrollbar-hide">
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
              className="flex-shrink-0 w-[100px] max-w-[100px]"
            />
          ))}
        </div>
      ) : (
        <div className="py-5 px-4 rounded-lg bg-wibe-card border border-wibe text-center">
          <p className="wibe-small text-wibe-secondary">فعلاً پیشنهادی برای این بخش نداریم</p>
        </div>
      )}
    </section>
  );
}
