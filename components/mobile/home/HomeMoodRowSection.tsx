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

type MoodListLinkProps = {
  moodId: string;
  list: HomeListData;
  compact?: boolean;
};

type HomeMoodRowSectionProps = {
  /** sidebar = ستون کنار هیرو در xl */
  variant?: 'default' | 'sidebar';
};

function MoodListLink({ moodId, list, compact }: MoodListLinkProps) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      onClick={() => trackMoodCardClick(moodId, 'list', list.slug)}
      className={`group flex items-center gap-2 rounded-lg hover:bg-wibe-surface ${
        compact ? 'px-1 py-1' : 'px-1.5 py-1.5'
      }`}
    >
      {list.coverImage ? (
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-gray-100 lg:h-10 lg:w-10">
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            className="h-full w-full object-cover"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="flex h-full w-full items-center justify-center bg-gray-100 text-sm"
            categorySlug={list.categories?.slug}
            listSlug={list.slug}
            listTitle={list.title}
          />
        </div>
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-wibe-surface text-base lg:h-10 lg:w-10">
          {list.categories?.icon ?? '📋'}
        </span>
      )}
      <span className="line-clamp-2 min-w-0 flex-1 wibe-caption font-medium text-foreground group-hover:text-primary">
        {list.title}
      </span>
    </Link>
  );
}

function MoodCard({ mood, compact }: { mood: HomeMoodCollection; compact?: boolean }) {
  const lists = mood.lists.slice(0, compact ? 2 : 3);

  return (
    <div
      className={`rounded-xl border border-wibe bg-wibe-card shadow-sm ${
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
        <p className="mt-0.5 wibe-caption text-wibe-secondary">{mood.subtitle}</p>
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
        onClick={() => trackMoodCardClick(mood.id, 'more')}
        className="mt-2 inline-flex items-center gap-0.5 wibe-caption font-semibold text-primary hover:underline"
      >
        بیشتر
        <ChevronLeft className="h-3 w-3 rotate-180" aria-hidden />
      </Link>
    </div>
  );
}

export default function HomeMoodRowSection({ variant = 'default' }: HomeMoodRowSectionProps) {
  const { data, isLoading } = useHomeData();
  const moods = useMemo(() => buildHomeMoodCollections(data), [data]);
  const isSidebar = variant === 'sidebar';

  if (isLoading && moods.length === 0) {
    if (isSidebar) {
      return (
        <div className="h-full min-h-[20rem] animate-pulse rounded-2xl bg-gray-100" aria-hidden />
      );
    }
    return (
      <section className="mb-6">
        <div className="mb-3 px-4 lg:px-0">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4 lg:px-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-[11.5rem] shrink-0 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </section>
    );
  }

  if (moods.length === 0) return null;

  if (isSidebar) {
    return (
      <section className="flex h-full min-h-0 flex-col" aria-label="بر اساس حال‌وهوا">
        <div className="mb-3">
          <h2 className="flex items-center gap-2 wibe-h3">
            <SectionIcon variant="mood" />
            بر اساس حال‌وهوا
          </h2>
          <p className="mt-0.5 wibe-caption text-wibe-secondary">انتخاب سریع برای امروز</p>
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
    <section className="mb-6 lg:mb-0" aria-label="بر اساس حال‌وهوا">
      <HomeSectionTitle
        iconVariant="mood"
        title="بر اساس حال‌وهوا"
        subtitle="انتخاب سریع برای حال امروزت"
        actionHref="/lists"
        actionLabel="همه"
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
        <p className="mt-1.5 px-4 text-center wibe-caption text-wibe-secondary lg:hidden">
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
