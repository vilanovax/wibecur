'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import type { SimilarItem, TrendingItem, AlsoLikedItem } from '@/types/items';

type DiscoveryTab = 'similar' | 'saves' | 'trending';

const TAB_ACTIVE = 'bg-primary text-white shadow-sm';
const TAB_INACTIVE =
  'text-wibe-secondary hover:bg-wibe-card hover:text-foreground';

const DISCOVERY_GRID_CLASS =
  'flex gap-3 overflow-x-auto overflow-y-hidden pb-1 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:snap-none';

const DESKTOP_ITEM_LIMIT = 8;

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
  className = 'flex-shrink-0 w-[calc(42vw)] max-w-[160px] snap-start lg:w-full lg:max-w-none',
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
      className={`${className} overflow-hidden rounded-2xl bg-wibe-card shadow-sm ring-1 ring-wibe/90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.99] lg:hover:shadow-md lg:hover:ring-primary/25`}
    >
      <div className="relative aspect-[2/3] w-full bg-wibe-surface lg:max-h-[11rem]">
        <LazyItemCoverImage
          itemId={itemId}
          title={title}
          imageUrl={imageUrl}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon ?? '📋'}
          className="absolute inset-0 h-full w-full object-cover"
          fallbackClassName="absolute inset-0 h-full w-full"
          coverLayout="grid"
        />
        {rank != null && rank <= 3 && (
          <span className="absolute end-2 top-2 rounded-full bg-warning px-1.5 py-0.5 wibe-caption font-semibold text-white shadow-sm">
            #{rank.toLocaleString('fa-IR')}
          </span>
        )}
        {ratingLabel && (
          <span className="absolute start-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-black/75 px-1.5 py-0.5 wibe-caption font-bold text-warning backdrop-blur-sm">
            ⭐ {ratingLabel}
          </span>
        )}
      </div>
      <div className="space-y-0.5 px-2.5 py-2 text-start">
        <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-foreground">
          {title}
        </h3>
        {subtitle ? (
          <p className="line-clamp-1 wibe-caption text-wibe-secondary">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}

function CarouselSkeleton({
  count = 4,
  className = 'min-w-[calc(42vw)] w-[calc(42vw)] max-w-[160px] aspect-[2/3] lg:w-full lg:min-w-0 lg:max-w-none',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`${DISCOVERY_GRID_CLASS}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${className} flex-shrink-0 animate-pulse rounded-2xl bg-wibe-surface`}
        />
      ))}
    </div>
  );
}

interface ItemDiscoverySectionProps {
  itemId: string;
  categoryId: string | null;
  categorySlug?: string | null;
  fetchEnabled?: boolean;
  initialSimilarItems?: SimilarItem[];
}

export default function ItemDiscoverySection({
  itemId,
  categoryId,
  categorySlug,
  fetchEnabled = true,
  initialSimilarItems,
}: ItemDiscoverySectionProps) {
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('similar');

  const { data: similarItems = initialSimilarItems ?? [], isLoading: similarLoading } = useQuery({
    queryKey: ['items', itemId, 'similar'],
    queryFn: async (): Promise<SimilarItem[]> => {
      const res = await fetch(`/api/items/${itemId}/similar`);
      const json = await res.json();
      return json.data && Array.isArray(json.data) ? json.data : [];
    },
    enabled: fetchEnabled && activeTab === 'similar',
    initialData: initialSimilarItems,
    staleTime: 5 * 60 * 1000,
  });

  const { data: alsoLikedItems = [], isLoading: alsoLikedLoading } = useQuery({
    queryKey: ['items', itemId, 'also-liked'],
    queryFn: async (): Promise<AlsoLikedItem[]> => {
      const res = await fetch(`/api/items/${itemId}/also-liked`);
      const json = await res.json();
      return json.data && Array.isArray(json.data) ? json.data : [];
    },
    enabled: fetchEnabled && activeTab === 'saves',
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingRaw = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['categories', categoryId, 'trending'],
    queryFn: async (): Promise<TrendingItem[]> => {
      const res = await fetch(`/api/categories/${categoryId}/trending`);
      const json = await res.json();
      const list = json.data && Array.isArray(json.data) ? (json.data as TrendingItem[]) : [];
      return list.filter((t) => t.id !== itemId);
    },
    enabled: fetchEnabled && activeTab === 'trending' && !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
  const trendingItems = trendingRaw;

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
    fetchEnabled &&
    (similarLoading ||
      alsoLikedLoading ||
      trendingLoading ||
      hasSimilar ||
      hasSaves ||
      hasTrending);

  if (!showSection) return null;

  const tabDescriptions: Record<DiscoveryTab, string> = {
    similar: 'بر اساس ژانر و حال‌وهوا',
    saves: 'کاربرانی که این را ذخیره کردند',
    trending: 'پرطرفدارهای این دسته',
  };

  return (
    <section className="pt-2 lg:rounded-2xl lg:border lg:border-wibe/60 lg:bg-wibe-card lg:p-5 lg:shadow-sm">
      <div className="mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 text-start">
          <h2 className="wibe-h3 text-foreground">پیشنهاد برای تو</h2>
          <p className="mt-1 wibe-caption text-wibe-secondary">
            {tabDescriptions[activeTab]}
          </p>
        </div>

        {availableTabs.length > 1 && (
          <div
            className="flex shrink-0 gap-1 rounded-full border border-wibe bg-wibe-surface p-1"
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
                className={`rounded-full px-3 py-1.5 wibe-caption font-semibold transition-[colors,transform] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] ${
                  activeTab === tab.id ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <CarouselSkeleton count={4} />
      ) : activeTab === 'similar' && hasSimilar ? (
        <div className={DISCOVERY_GRID_CLASS}>
          {similarItems.slice(0, DESKTOP_ITEM_LIMIT).map((s) => (
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
        <div className={DISCOVERY_GRID_CLASS}>
          {alsoLikedItems.slice(0, DESKTOP_ITEM_LIMIT).map((a) => (
            <DiscoveryCarouselCard
              key={a.id}
              href={`/items/${a.id}`}
              itemId={a.id}
              title={a.title}
              imageUrl={a.image}
              categorySlug={categorySlug}
              rating={a.rating}
              subtitle={`${a.commonUsersCount.toLocaleString('fa-IR')} نفر همراه`}
              className="flex-shrink-0 w-[calc(42vw)] max-w-[160px] snap-start lg:w-full lg:max-w-none"
            />
          ))}
        </div>
      ) : activeTab === 'trending' && hasTrending ? (
        <div className={DISCOVERY_GRID_CLASS}>
          {trendingItems.slice(0, DESKTOP_ITEM_LIMIT).map((t, index) => (
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
        <div className="rounded-2xl border border-dashed border-wibe bg-wibe-surface py-6 text-center">
          <p className="wibe-small text-wibe-secondary">فعلاً پیشنهادی برای این بخش نداریم</p>
        </div>
      )}
    </section>
  );
}
