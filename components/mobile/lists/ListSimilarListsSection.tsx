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
      className="w-[calc(55vw)] max-w-[220px] shrink-0 overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-[colors,transform] active:scale-[0.99] lg:w-full lg:max-w-none lg:hover:border-primary/20 lg:hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-wibe-surface lg:aspect-[16/10] lg:max-h-[7.25rem]">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2 text-right lg:p-2.5">
          <h3 className="line-clamp-2 wibe-small font-semibold text-white lg:hidden">{title}</h3>
        </div>
      </div>
      <div className="hidden min-w-0 p-2 lg:block">
        <h3 className="line-clamp-2 wibe-caption font-semibold text-foreground">{title}</h3>
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
        className={`${LIST_SECTION_SCROLL_MT} mt-1 border-t border-wibe pt-4 lg:rounded-2xl lg:border lg:bg-wibe-card/60 lg:p-5 lg:pt-5`}
        aria-hidden
      >
        <div className="mb-3 h-6 w-36 animate-pulse rounded bg-wibe-surface" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 w-[55vw] max-w-[220px] shrink-0 animate-pulse rounded-lg bg-wibe-surface lg:h-32 lg:w-full" />
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
        className={`${LIST_SECTION_SCROLL_MT} mt-1 border-t border-wibe pt-4 lg:rounded-2xl lg:border lg:bg-wibe-card/60 lg:p-5 lg:pt-5`}
        aria-busy
        aria-label="در حال بارگذاری لیست‌های مشابه"
      >
        <div className="mb-3 h-6 w-36 animate-pulse rounded bg-wibe-surface" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 w-[55vw] max-w-[220px] shrink-0 animate-pulse rounded-lg bg-wibe-surface lg:h-32 lg:w-full" />
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
      className={`${LIST_SECTION_SCROLL_MT} mt-1 border-t border-wibe pt-4 lg:rounded-2xl lg:border lg:bg-wibe-card/60 lg:p-5 lg:pt-5`}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="wibe-h3 text-foreground">لیست‌های مشابه</h3>
          <p className="mt-0.5 wibe-caption text-wibe-secondary">ممکنه این‌ها هم به کارت بیان</p>
        </div>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:px-0 xl:grid-cols-5 2xl:grid-cols-6">
        {relatedLists.map((rel) => (
          <SimilarListCard key={rel.id} rel={rel} />
        ))}
      </div>
    </section>
  );
}
