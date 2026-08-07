'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLazyInView } from '@/hooks/useLazyInView';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getDisplayListTitle } from '@/lib/list-display-title';
import { fetchListSimilar, type SimilarListClient } from '@/lib/list-similar-client';

export const LIST_SECTION_SCROLL_MT = 'scroll-mt-[7.5rem]';

type SimilarList = SimilarListClient;

function SimilarListCard({ rel }: { rel: SimilarList }) {
  const title = getDisplayListTitle({
    title: rel.title,
    slug: rel.slug,
    categorySlug: rel.categories?.slug,
  });
  return (
    <Link
      href={`/lists/${rel.slug}`}
      className="w-[calc(58vw)] max-w-[230px] shrink-0 overflow-hidden rounded-2xl bg-wibe-card shadow-sm ring-1 ring-wibe/90 transition-[colors,transform,box-shadow] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.99] lg:w-full lg:max-w-none lg:hover:shadow-md lg:hover:ring-primary/25"
    >
      <div className="relative aspect-[16/10] bg-wibe-surface lg:max-h-[7.5rem]">
        <ImageWithFallback
          src={rel.coverImage ?? ''}
          alt={title}
          className="h-full w-full object-cover"
          fallbackIcon={rel.categories?.icon ?? '📋'}
          fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-2xl"
          categorySlug={rel.categories?.slug}
          listSlug={rel.slug}
          listTitle={rel.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        {rel.categories?.name ? (
          <span className="absolute start-2 top-2 inline-flex max-w-[85%] truncate rounded-full bg-black/45 px-2 py-0.5 wibe-caption font-medium text-white/95 backdrop-blur-sm">
            {rel.categories.icon ? `${rel.categories.icon} ` : ''}
            {rel.categories.name}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 space-y-0.5 px-2.5 py-2.5 text-start">
        <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-foreground">
          {title}
        </h3>
        {rel.itemCount > 0 ? (
          <p className="wibe-caption tabular-nums text-wibe-secondary">
            {rel.itemCount.toLocaleString('fa-IR')} آیتم
          </p>
        ) : null}
      </div>
    </Link>
  );
}

type ListSimilarListsSectionProps = {
  listSlug: string;
};

export default function ListSimilarListsSection({ listSlug }: ListSimilarListsSectionProps) {
  const { ref, inView } = useLazyInView<HTMLElement>({ rootMargin: '320px', once: true });
  const [relatedLists, setRelatedLists] = useState<SimilarList[] | null>(null);

  useEffect(() => {
    if (!inView || relatedLists !== null) return;

    let cancelled = false;
    fetchListSimilar(listSlug).then((lists) => {
      if (!cancelled) setRelatedLists(lists);
    });

    return () => {
      cancelled = true;
    };
  }, [inView, listSlug, relatedLists]);

  if (!inView) {
    return (
      <section
        ref={ref}
        id="list-similar-section"
        className={`${LIST_SECTION_SCROLL_MT} mt-2 border-t border-wibe/80 pt-5 lg:rounded-2xl lg:border lg:border-wibe lg:bg-wibe-card/60 lg:p-5 lg:pt-5`}
        aria-hidden
      >
        <div className="mb-3 h-6 w-36 animate-pulse rounded-lg bg-wibe-surface" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 w-[58vw] max-w-[230px] shrink-0 animate-pulse rounded-2xl bg-wibe-surface lg:h-40 lg:w-full"
            />
          ))}
        </div>
      </section>
    );
  }

  if (relatedLists === null) {
    return (
      <section
        ref={ref}
        id="list-similar-section"
        className={`${LIST_SECTION_SCROLL_MT} mt-2 border-t border-wibe/80 pt-5 lg:rounded-2xl lg:border lg:border-wibe lg:bg-wibe-card/60 lg:p-5 lg:pt-5`}
        aria-busy
        aria-label="در حال بارگذاری لیست‌های مشابه"
      >
        <div className="mb-3 h-6 w-36 animate-pulse rounded-lg bg-wibe-surface" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 w-[58vw] max-w-[230px] shrink-0 animate-pulse rounded-2xl bg-wibe-surface lg:h-40 lg:w-full"
            />
          ))}
        </div>
      </section>
    );
  }

  if (relatedLists.length === 0) return null;

  return (
    <section
      ref={ref}
      id="list-similar-section"
      className={`${LIST_SECTION_SCROLL_MT} mt-2 border-t border-wibe/80 pt-5 lg:rounded-2xl lg:border lg:border-wibe lg:bg-wibe-card/60 lg:p-5 lg:pt-5`}
    >
      <div className="mb-3.5">
        <h3 className="wibe-h3 text-foreground">لیست‌های مشابه</h3>
        <p className="mt-1 wibe-caption text-wibe-secondary">ممکنه این‌ها هم به کارت بیان</p>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:px-0 xl:grid-cols-5 2xl:grid-cols-6">
        {relatedLists.map((rel) => (
          <SimilarListCard key={rel.id} rel={rel} />
        ))}
      </div>
    </section>
  );
}
