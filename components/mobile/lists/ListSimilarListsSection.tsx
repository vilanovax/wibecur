'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLazyInView } from '@/hooks/useLazyInView';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getDisplayListTitle } from '@/lib/list-display-title';
import { fetchListSimilar, type SimilarListClient } from '@/lib/list-similar-client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
      className="block w-[calc(55vw)] max-w-56 shrink-0 lg:w-full lg:max-w-none"
    >
      <Card className="overflow-hidden bg-popover p-0 transition-transform active:scale-[0.99]">
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
        <div className="absolute inset-x-0 bottom-0 p-2 text-start lg:p-2.5">
          <h3 className="line-clamp-2 wibe-small font-semibold text-white lg:hidden">{title}</h3>
        </div>
      </div>
      <div className="hidden min-w-0 p-2 lg:block">
        <h3 className="line-clamp-2 wibe-caption font-semibold text-foreground">{title}</h3>
      </div>
      </Card>
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
        className={`${LIST_SECTION_SCROLL_MT} mt-1`}
        aria-hidden
      >
        <Card className="rounded-none border-0 bg-transparent p-0 shadow-none lg:border lg:bg-popover lg:p-5 lg:shadow-surface">
          <Skeleton className="mb-3 h-6 w-36" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-[55vw] max-w-56 shrink-0 rounded-lg lg:h-32 lg:w-full" />
            ))}
          </div>
        </Card>
      </section>
    );
  }

  if (relatedLists === null) {
    return (
      <section
        ref={ref}
        id="list-similar-section"
        className={`${LIST_SECTION_SCROLL_MT} mt-1`}
        aria-busy
        aria-label="در حال بارگذاری لیست‌های مشابه"
      >
        <Card className="rounded-none border-0 bg-transparent p-0 shadow-none lg:border lg:bg-popover lg:p-5 lg:shadow-surface">
          <Skeleton className="mb-3 h-6 w-36" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-[55vw] max-w-56 shrink-0 rounded-lg lg:h-32 lg:w-full" />
            ))}
          </div>
        </Card>
      </section>
    );
  }

  if (relatedLists.length === 0) return null;

  return (
    <section
      ref={ref}
      id="list-similar-section"
      className={`${LIST_SECTION_SCROLL_MT} mt-1`}
    >
      <Card className="rounded-none border-0 bg-transparent p-0 shadow-none lg:border lg:bg-popover lg:p-5 lg:shadow-surface">
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
      </Card>
    </section>
  );
}
