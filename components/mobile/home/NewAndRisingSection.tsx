'use client';

import Link from 'next/link';
import { TrendingUp, Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import HomeSectionTitle from './HomeSectionTitle';

export default function NewAndRisingSection() {
  const { data, isLoading } = useHomeData();
  const lists = (data?.rising ?? []).slice(0, 4);

  if (isLoading && lists.length === 0) {
    return (
      <section className="mb-6">
        <div className="px-4 mb-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="px-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg h-20 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) return null;

  return (
    <section className="mb-6">
      <HomeSectionTitle
        icon="🚀"
        title="در حال اوج گرفتن"
        subtitle="رشد سریع ذخیره در ۲۴ ساعت اخیر"
      />
      <div className="px-4 space-y-2">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex flex-row-reverse gap-3 rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-sm active:scale-[0.99] transition-transform p-3"
          >
            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
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
