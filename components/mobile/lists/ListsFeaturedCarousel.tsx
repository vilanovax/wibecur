'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
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
  'w-[min(92vw,22rem)] shrink-0 snap-start max-lg:snap-center lg:w-full lg:max-w-none lg:shrink';

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
    <section className="mb-5 w-full min-w-0 lg:mb-7" aria-label="منتخب">
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="wibe-h3 flex items-center gap-1.5 text-foreground">
          <span aria-hidden>⭐</span>
          <span>منتخب</span>
        </h2>
        {lists.length > 1 && (
          <span className="rounded-full bg-wibe-surface px-2.5 py-0.5 wibe-caption font-medium text-wibe-secondary tabular-nums ring-1 ring-wibe/80">
            {(activeIndex + 1).toLocaleString('fa-IR')} از {lists.length.toLocaleString('fa-IR')}
          </span>
        )}
      </div>

      {lists.length === 1 ? (
        <FeaturedSlide list={lists[0]} priority className="w-full max-w-2xl lg:max-w-none" />
      ) : (
        <>
          <div
            ref={scrollRef}
            className="-mx-0.5 max-lg:flex max-lg:w-full max-lg:snap-x max-lg:snap-mandatory max-lg:gap-3 max-lg:overflow-x-auto max-lg:pb-1 max-lg:scrollbar-hide lg:mx-0 lg:grid lg:w-full lg:grid-cols-3 lg:gap-4"
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
              >
                <FeaturedSlide list={list} priority={i === 0} className="w-full" />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-1.5 lg:hidden" aria-hidden>
            {lists.map((list, i) => (
              <span
                key={list.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-wibe-secondary/25'
                }`}
              />
            ))}
          </div>
        </>
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
  const categorySlug = list.categories?.slug ?? null;
  const categoryLabel = list.categories?.name
    ? `${list.categories.icon ? `${list.categories.icon} ` : ''}${list.categories.name}`
    : null;
  const saveCount = list.saveCount ?? 0;

  return (
    <Link
      href={`/lists/${list.slug}`}
      className={`group relative block aspect-[2/1] min-h-[118px] overflow-hidden rounded-2xl bg-wibe-surface shadow-[0_10px_28px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.06] transition-[transform,box-shadow] active:scale-[0.99] sm:aspect-[5/3] sm:min-h-[136px] lg:aspect-[3/2] lg:min-h-[180px] lg:hover:shadow-[0_16px_36px_-14px_rgba(15,23,42,0.4)] xl:min-h-[200px] ${className}`}
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
        fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-4xl"
        priority={priority}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
      {categoryLabel && (
        <span className="absolute top-2.5 end-2.5 rounded-lg bg-black/50 px-2 py-1 wibe-caption font-medium text-white/95 backdrop-blur-sm">
          {categoryLabel}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3.5 text-right lg:p-4">
        <h3 className="line-clamp-2 wibe-small font-bold leading-snug text-white drop-shadow-sm lg:text-lg">
          {list.title}
        </h3>
        {saveCount > 0 && (
          <span className="inline-flex items-center gap-1 self-end wibe-caption font-medium text-white/85">
            <Bookmark className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {saveCount.toLocaleString('fa-IR')} ذخیره
          </span>
        )}
      </div>
    </Link>
  );
}
