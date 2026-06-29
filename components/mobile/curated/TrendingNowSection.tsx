'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';
import ExploreSectionTitle from './ExploreSectionTitle';
import ExploreTrendingPrefetchLink from './ExploreTrendingPrefetchLink';
import type { CuratedList } from '@/types/curated';

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
    <section id="trending" className="px-2.5 py-4 lg:px-0 lg:py-5" aria-labelledby="trending-title">
      <ExploreSectionTitle
        id="trending-title"
        title="داغ‌ترین لیست‌های امروز"
        subtitle={subtitle}
        iconVariant="trending"
      />

      <HorizontalScrollFade
        surface="surface"
        fadeClassName="lg:hidden"
        innerClassName="-mx-2.5 flex snap-x snap-mandatory gap-3 px-2.5 pb-1 lg:mx-0 lg:px-0"
      >
        {lists.map((list, index) => (
          <div
            key={list.id}
            className="w-[78%] max-w-[280px] shrink-0 snap-start sm:w-[46%] md:w-[38%] lg:w-[calc(25%-0.5625rem)] lg:max-w-none xl:w-[calc(20%-0.6rem)]"
          >
            <TrendingCard list={list} priority={index < 2} />
          </div>
        ))}
      </HorizontalScrollFade>
    </section>
  );
}

function TrendingCard({ list, priority = false }: { list: CuratedList; priority?: boolean }) {
  const href = `/lists/${list.slug}`;

  return (
    <ExploreTrendingPrefetchLink
      href={href}
      className="group block transition-transform active:scale-[0.99] lg:hover:scale-[1.01]"
    >
      <div className="overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm lg:rounded-xl lg:group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-gray-200 lg:aspect-[16/10]">
          <ImageWithFallback
            src={list.coverUrl ?? ''}
            alt={list.title}
            className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
            fallbackIcon="📋"
            fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-2xl"
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, 78vw"
            priority={priority}
          />
          <span className="absolute right-2 top-2 rounded-full bg-warning px-2 py-0.5 wibe-caption font-semibold text-white lg:text-xs">
            ترند
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent lg:from-black/85" />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-white lg:hidden">{list.title}</h3>
            <h3 className="hidden line-clamp-2 wibe-small font-bold leading-snug text-white lg:block">
              {list.title}
            </h3>
          </div>
        </div>
        <div className="p-2.5 lg:hidden">
          <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
        </div>
      </div>
    </ExploreTrendingPrefetchLink>
  );
}
