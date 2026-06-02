'use client';

import Link from 'next/link';
import { TrendingUp, Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import HomeSectionTitle from './HomeSectionTitle';

export default function NewAndRisingSection({ embedded = false }: { embedded?: boolean }) {
  const { data, isLoading } = useHomeData();
  const lists = (data?.rising ?? []).slice(0, 6);

  if (isLoading && lists.length === 0) {
    return (
      <section className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className="space-y-3 px-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg h-20 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) {
    return embedded ? (
      <p className="px-4 py-6 text-center wibe-small text-wibe-secondary">فعلاً لیست اوج‌گیری نیست</p>
    ) : null;
  }

  return (
    <section className={embedded ? '' : 'mb-6'}>
      {!embedded && (
        <HomeSectionTitle
          icon="🚀"
          title="در حال اوج گرفتن"
          subtitle="رشد سریع ذخیره در ۲۴ ساعت اخیر"
          actionHref="/lists?mode=popular"
          actionLabel="همه"
        />
      )}
      <div className="space-y-2 px-4 lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0 lg:px-0">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex flex-row-reverse gap-3 overflow-hidden rounded-lg border border-wibe bg-wibe-card p-3 shadow-sm transition-transform active:scale-[0.99] lg:min-h-0 lg:p-2.5 lg:hover:border-primary/20 lg:hover:shadow-md"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200 lg:h-[4.5rem] lg:w-[4.5rem]">
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="w-full h-full object-cover"
                fallbackIcon={list.categories?.icon ?? '📋'}
                fallbackClassName="w-full h-full flex items-center justify-center bg-gray-200"
                categorySlug={list.categories?.slug}
                listSlug={list.slug}
                listTitle={list.title}
              />
              {(list as { isFastRising?: boolean }).isFastRising && (
                <span className="absolute top-1 right-1 bg-success text-white wibe-caption font-semibold px-1.5 py-0.5 rounded-pill flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
              <p className="wibe-caption text-wibe-secondary mt-1 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-primary" />
                {list.saveCount.toLocaleString('fa-IR')} ذخیره · {list.itemCount} آیتم
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
