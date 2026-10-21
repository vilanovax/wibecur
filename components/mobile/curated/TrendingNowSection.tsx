'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ExploreSectionTitle from './ExploreSectionTitle';
import ExploreTrendingPrefetchLink from './ExploreTrendingPrefetchLink';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import type { CuratedList } from '@/types/curated';
import { Card } from '@/components/ui/card';

interface TrendingNowSectionProps {
  lists: CuratedList[];
  subtitle?: string;
}

export default function TrendingNowSection({
  lists,
  subtitle = 'بر اساس ذخیره',
}: TrendingNowSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section id="trending" className="px-4 py-4 lg:px-0 lg:py-5" aria-labelledby="trending-title">
      <ExploreSectionTitle
        id="trending-title"
        title="داغ‌ترین لیست‌های امروز"
        subtitle={subtitle}
        iconVariant="trending"
      />

      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible xl:grid-cols-5">
        {lists.map((list, index) => (
          <div
            key={list.id}
            className="w-72 shrink-0 snap-start lg:w-auto lg:min-w-0"
          >
            <TrendingCard list={list} priority={index === 0} showBadge={index === 0} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendingCard({
  list,
  priority = false,
  showBadge = false,
}: {
  list: CuratedList;
  priority?: boolean;
  showBadge?: boolean;
}) {
  const href = `/lists/${list.slug}`;
  const trustedCover = resolveCoverImage({
    coverImage: list.coverUrl,
    categorySlug: list.category?.slug,
    listSlug: list.slug,
    listTitle: list.title,
  });

  return (
    <ExploreTrendingPrefetchLink
      href={href}
      className="group block transition-transform active:scale-95"
    >
      <Card className="overflow-hidden bg-popover p-0 lg:group-hover:shadow-md">
        <div className="relative aspect-4/3 bg-muted lg:aspect-video">
          <ImageWithFallback
            src={trustedCover}
            alt={list.title}
            className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
            fallbackIcon="📋"
            fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-2xl"
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 18rem"
            priority={priority}
            fetchPriority={priority ? 'high' : 'low'}
            categorySlug={list.category?.slug}
            listSlug={list.slug}
            listTitle={list.title}
          />
          {showBadge ? (
            <span className="absolute inset-e-2 top-2 rounded-md bg-foreground/50 px-1.5 py-0.5 text-xs font-medium text-background backdrop-blur-sm">
              داغ
            </span>
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/75 via-transparent to-transparent lg:from-foreground/80" />
          <div className="absolute inset-x-0 bottom-0 p-3 text-start lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-background lg:text-base lg:font-bold lg:leading-snug">
              {list.title}
            </h3>
          </div>
        </div>
      </Card>
    </ExploreTrendingPrefetchLink>
  );
}
