'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useMemo } from 'react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import { buildHomeMoodCollections, type HomeMoodCollection } from '@/lib/home-mood-collections';
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';
import SectionIcon from '@/components/shared/SectionIcon';
import HomeSectionTitle from './HomeSectionTitle';
import type { HomeListData } from '@/types/home-data';
import { trackMoodCardClick } from '@/lib/analytics';
import { Card } from '@/components/ui/card';

type MoodListLinkProps = {
  moodId: string;
  list: HomeListData;
  compact?: boolean;
};

type HomeMoodRowSectionProps = {
  /** sidebar = ستون کنار هیرو | responsive = یک mount با layout واکنش‌گرا */
  variant?: 'default' | 'sidebar' | 'responsive';
  className?: string;
};

function MoodListLink({ moodId, list, compact }: MoodListLinkProps) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      prefetch={false}
      onClick={() => trackMoodCardClick(moodId, 'list', list.slug)}
      className={`group flex min-h-11 items-center gap-2 rounded-lg hover:bg-muted ${
        compact ? 'px-1' : 'px-2'
      }`}
    >
      {list.coverImage ? (
        <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            className="h-full w-full object-cover"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-sm"
            categorySlug={list.categories?.slug}
            listSlug={list.slug}
            listTitle={list.title}
            sizes="40px"
            fetchPriority="low"
          />
        </div>
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted text-base">
          {list.categories?.icon ?? '📋'}
        </span>
      )}
      <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium text-foreground group-hover:text-brand">
        {list.title}
      </span>
    </Link>
  );
}

function MoodCard({ mood, compact }: { mood: HomeMoodCollection; compact?: boolean }) {
  const lists = mood.lists.slice(0, compact ? 2 : 3);

  return (
    <Card
      className={`bg-popover shadow-sm ${
        compact ? 'p-3' : 'w-[11.5rem] shrink-0 snap-start p-3 lg:w-full lg:p-4'
      }`}
    >
      <div className="mb-2">
        <p className="wibe-small font-bold text-foreground">
          <span aria-hidden className="ms-1">
            {mood.icon}
          </span>
          {mood.label}
        </p>
        <p className="mt-0.5 wibe-caption text-muted-foreground">{mood.subtitle}</p>
      </div>

      <ul className="space-y-1">
        {lists.map((list) => (
          <li key={list.id}>
            <MoodListLink moodId={mood.id} list={list} compact={compact} />
          </li>
        ))}
      </ul>

      <Link
        href={mood.href}
        prefetch={false}
        onClick={() => trackMoodCardClick(mood.id, 'more')}
        className="mt-2 inline-flex min-h-11 items-center"
      >
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
          بیشتر
          <ChevronLeft className="h-3 w-3" aria-hidden />
        </span>
      </Link>
    </Card>
  );
}

export default function HomeMoodRowSection({
  variant = 'default',
  className = '',
}: HomeMoodRowSectionProps) {
  const { data, isLoading } = useHomeData();
  const moods = useMemo(() => buildHomeMoodCollections(data), [data]);
  const isSidebar = variant === 'sidebar';
  const isResponsive = variant === 'responsive';

  if (isLoading && moods.length === 0) {
    if (isSidebar || isResponsive) {
      return (
        <div
          className={`h-full min-h-80 animate-pulse rounded-surface bg-muted ${className}`}
          aria-hidden
        />
      );
    }
    return (
      <section className="mb-6">
        <div className="mb-3 px-4 lg:px-0">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4 lg:px-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-44 shrink-0 animate-pulse rounded-surface bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (moods.length === 0) return null;

  if (isResponsive) {
    return (
      <section className={className} aria-label="بر اساس حال‌وهوا">
        <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-col">
          <div className="mb-3">
            <h2 className="flex items-center gap-2 wibe-h3">
              <SectionIcon variant="mood" />
              بر اساس حال‌وهوا
            </h2>
            <p className="mt-0.5 wibe-caption text-muted-foreground">انتخاب سریع برای امروز</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {moods.map((mood) => (
              <MoodCard key={mood.id} mood={mood} compact />
            ))}
          </div>
        </div>

        <div className="xl:hidden">
          <HomeSectionTitle
            iconVariant="mood"
            title="بر اساس حال‌وهوا"
            subtitle="انتخاب سریع برای حال امروزت"
            actionHref="/explore"
            actionLabel="اکسپلور"
            analyticsSection="mood"
          />
          <HorizontalScrollFade
            surface="surface"
            fadeClassName="lg:hidden"
            className="lg:hidden"
            innerClassName="flex snap-x snap-mandatory gap-3 px-4 pb-1"
          >
            {moods.map((mood) => (
              <MoodCard key={mood.id} mood={mood} />
            ))}
          </HorizontalScrollFade>
          {moods.length > 2 ? (
            <p className="mt-1.5 px-4 text-center wibe-caption text-muted-foreground lg:hidden">
              بکش برای بیشتر ←
            </p>
          ) : null}
          <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
            {moods.map((mood) => (
              <MoodCard key={mood.id} mood={mood} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isSidebar) {
    return (
      <section
        className={`flex h-full min-h-0 flex-col ${className}`}
        aria-label="بر اساس حال‌وهوا"
      >
        <div className="mb-3">
          <h2 className="flex items-center gap-2 wibe-h3">
            <SectionIcon variant="mood" />
            بر اساس حال‌وهوا
          </h2>
          <p className="mt-0.5 wibe-caption text-muted-foreground">انتخاب سریع برای امروز</p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {moods.map((mood) => (
            <MoodCard key={mood.id} mood={mood} compact />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`mb-6 lg:mb-0 ${className}`} aria-label="بر اساس حال‌وهوا">
      <HomeSectionTitle
        iconVariant="mood"
        title="بر اساس حال‌وهوا"
        subtitle="انتخاب سریع برای حال امروزت"
        actionHref="/explore"
        actionLabel="اکسپلور"
        analyticsSection="mood"
      />

      <HorizontalScrollFade
        surface="surface"
        fadeClassName="lg:hidden"
        className="lg:hidden"
        innerClassName="flex snap-x snap-mandatory gap-3 px-4 pb-1"
      >
        {moods.map((mood) => (
          <MoodCard key={mood.id} mood={mood} />
        ))}
      </HorizontalScrollFade>
      {moods.length > 2 ? (
        <p className="mt-1.5 px-4 text-center wibe-caption text-muted-foreground lg:hidden">
          بکش برای بیشتر ←
        </p>
      ) : null}

      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4 lg:px-0">
        {moods.map((mood) => (
          <MoodCard key={mood.id} mood={mood} />
        ))}
      </div>
    </section>
  );
}
