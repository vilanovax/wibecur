'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import ListCoverImage from '@/components/shared/ListCoverImage';

export type FeaturedListItem = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  horizontalImage?: string | null;
  bannerImage?: string | null;
  saveCount?: number;
  categories?: { slug?: string | null; icon?: string | null; name?: string | null } | null;
};

interface ListsFeaturedCarouselProps {
  lists: FeaturedListItem[];
}

const SLIDE_CLASS =
  'w-80 min-w-80 shrink-0 snap-start lg:min-w-0 lg:w-full lg:max-w-none lg:shrink';

export default function ListsFeaturedCarousel({ lists }: ListsFeaturedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || lists.length <= 1) return;

    const slides = root.querySelectorAll('[data-featured-slide]');
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best?.target) return;
        const idx = Number((best.target as HTMLElement).dataset.index);
        if (!Number.isNaN(idx)) setActiveIndex(idx);
      },
      { root, threshold: [0.55, 0.75] }
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [lists.length]);

  if (lists.length === 0) return null;

  return (
    <section className="mb-2 w-full min-w-0 lg:mb-5" aria-label="منتخب">
      <div className="mb-1.5 flex items-center justify-between gap-2 lg:mb-2">
        <h2 className="flex items-center gap-1.5 wibe-h3 text-foreground">
          <Sparkles className="size-4" strokeWidth={1.75} aria-hidden />
          <span>منتخب</span>
        </h2>
        {lists.length > 1 && (
          <span
            className="wibe-caption tabular-nums text-muted-foreground"
            aria-live="polite"
          >
            {(activeIndex + 1).toLocaleString('fa-IR')}/{lists.length.toLocaleString('fa-IR')}
          </span>
        )}
      </div>

      {lists.length === 1 ? (
        <FeaturedSlide list={lists[0]} priority className="w-full max-w-2xl lg:max-w-none" />
      ) : (
        <div
          ref={scrollRef}
          className="max-lg:flex max-lg:w-full max-lg:snap-x max-lg:snap-mandatory max-lg:gap-2.5 max-lg:overflow-x-auto max-lg:pb-0.5 max-lg:scrollbar-hide lg:grid lg:w-full lg:grid-cols-3 lg:gap-4"
          role="list"
          aria-label="لیست‌های منتخب"
        >
          {lists.map((list, i) => (
            <div
              key={list.id}
              role="listitem"
              data-featured-slide
              data-index={i}
              className={SLIDE_CLASS}
              aria-current={i === activeIndex ? 'true' : undefined}
            >
              <FeaturedSlide list={list} priority={i === 0} className="w-full" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedSlide({
  list,
  priority,
  className = '',
}: {
  list: FeaturedListItem;
  priority?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const categorySlug = list.categories?.slug ?? null;
  const categoryLabel = list.categories?.name
    ? `${list.categories.icon ? `${list.categories.icon} ` : ''}${list.categories.name}`
    : null;

  return (
    <Link
      href={`/lists/${list.slug}`}
      prefetch={false}
      onPointerDown={() => router.prefetch(`/lists/${list.slug}`)}
      className={`group relative block aspect-5/2 min-h-20 overflow-hidden rounded-surface border border-border bg-muted shadow-surface transition-[colors,transform] active:scale-95 sm:aspect-5/3 sm:min-h-28 lg:aspect-3/2 lg:min-h-44 lg:hover:border-brand/30 xl:min-h-52 ${className}`}
    >
      <ListCoverImage
        coverImage={list.coverImage}
        horizontalImage={list.horizontalImage}
        bannerImage={list.bannerImage}
        title={list.title}
        slug={list.slug}
        categorySlug={categorySlug}
        variant="banner"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
        fallbackIcon={list.categories?.icon ?? '📋'}
        fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-3xl lg:text-4xl"
        priority={priority}
        fetchPriority={priority ? 'high' : 'low'}
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-l from-foreground/85 via-foreground/45 to-foreground/15" />
      {categoryLabel && (
        <span className="absolute inset-e-1.5 top-1.5 rounded-md bg-foreground/45 px-1.5 py-0.5 wibe-caption text-background/95 backdrop-blur-sm lg:inset-e-2.5 lg:top-2.5 lg:px-2">
          {categoryLabel}
        </span>
      )}
      <div className="absolute inset-0 flex flex-col justify-end p-2 text-start lg:p-4">
        <h3 className="line-clamp-2 wibe-small font-bold text-background">
          {list.title}
        </h3>
      </div>
    </Link>
  );
}
