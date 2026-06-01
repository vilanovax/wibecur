'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { isDisplayableDescription } from '@/lib/lists-card-utils';
import ListCoverImage from '@/components/shared/ListCoverImage';

export type FeaturedListItem = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  saveCount?: number;
  categories?: { slug?: string | null; icon?: string | null; name?: string | null } | null;
};

interface ListsFeaturedCarouselProps {
  lists: FeaturedListItem[];
}

const SLIDE_CLASS =
  'w-[88%] max-w-[320px] shrink-0 snap-start lg:w-full lg:max-w-none lg:shrink';

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
    <section className="mb-4 lg:mb-5" aria-label="منتخب">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="wibe-h3 flex items-center gap-1.5">
          <span aria-hidden>⭐</span>
          <span>منتخب</span>
        </h2>
        {lists.length > 1 && (
          <span className="wibe-caption text-wibe-secondary tabular-nums">
            {(activeIndex + 1).toLocaleString('fa-IR')}/{lists.length.toLocaleString('fa-IR')}
          </span>
        )}
      </div>

      {lists.length === 1 ? (
        <FeaturedSlide list={lists[0]} priority className="w-full max-w-2xl lg:max-w-none" />
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex w-full snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:snap-none"
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
          <div className="mt-2 flex justify-center gap-1.5 lg:hidden" aria-hidden>
            {lists.map((list, i) => (
              <span
                key={list.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-wibe-secondary/30'
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

  return (
    <Link
      href={`/lists/${list.slug}`}
      className={`group relative block aspect-[16/10] min-h-[148px] overflow-hidden rounded-xl border border-wibe shadow-sm transition-all active:scale-[0.99] sm:aspect-[5/3] lg:aspect-[3/2] lg:min-h-[200px] lg:hover:border-primary/30 lg:hover:shadow-lg xl:min-h-[220px] ${className}`}
    >
      <ListCoverImage
        coverImage={list.coverImage}
        title={list.title}
        slug={list.slug}
        categorySlug={categorySlug}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
        fallbackIcon={list.categories?.icon ?? '📋'}
        fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-4xl"
        priority={priority}
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/50 to-black/20" />
      {categoryLabel && (
        <span className="absolute top-2.5 right-2.5 rounded-md bg-black/45 px-2 py-0.5 wibe-caption text-white/95 backdrop-blur-sm">
          {categoryLabel}
        </span>
      )}
      <div className="absolute inset-0 flex flex-col justify-end p-3 text-right lg:p-4">
        <h3 className="line-clamp-2 wibe-small font-bold text-white lg:text-lg">{list.title}</h3>
        {list.description?.trim() && isDisplayableDescription(list.description) && (
          <p className="mt-0.5 line-clamp-2 wibe-caption text-white/85 lg:line-clamp-2 lg:text-sm">
            {list.description.trim()}
          </p>
        )}
        <p className="mt-1 flex items-center justify-end gap-1 wibe-caption text-white/75 lg:text-sm">
          <Bookmark className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          {(list.saveCount ?? 0).toLocaleString('fa-IR')} ذخیره
        </p>
      </div>
    </Link>
  );
}
