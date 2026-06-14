'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';

export interface HomeGridListCardList {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  saveCount: number;
  categories?: { slug?: string; icon?: string | null } | null;
}

interface HomeGridListCardProps {
  list: HomeGridListCardList;
  /** بدون badge پیش‌فرض — فقط وقتی معنای اضافه دارد */
  badge?: string | null;
  badgeClassName?: string;
}

/** کارت گرید Home — موبایل اسکرول افقی، دسکتاپ landscape فشرده */
export default function HomeGridListCard({
  list,
  badge,
  badgeClassName = 'bg-primary/90 text-white',
}: HomeGridListCardProps) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block w-[10rem] shrink-0 snap-start lg:w-full lg:shrink"
    >
      <div className="overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-card transition-all active:scale-[0.99] lg:rounded-xl lg:hover:border-primary/20 lg:hover:shadow-md">
        <div className="relative aspect-[5/4] w-full bg-gray-100 sm:aspect-[4/3] lg:aspect-[16/10] lg:max-h-[11.5rem]">
          {badge ? (
            <span
              className={`absolute right-2 top-2 z-10 rounded-pill px-2 py-0.5 wibe-caption font-semibold shadow-sm ${badgeClassName}`}
            >
              {badge}
            </span>
          ) : null}
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
            fallbackIcon={list.categories?.icon ?? '📋'}
            fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-3xl"
            categorySlug={list.categories?.slug}
            listSlug={list.slug}
            listTitle={list.title}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5 lg:via-black/25"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-right lg:p-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-white drop-shadow-sm lg:text-[0.8125rem] lg:leading-snug">
              {list.title}
            </h3>
            <p className="mt-1 flex items-center justify-end gap-1 wibe-caption text-white/90">
              <Bookmark className="h-3 w-3 shrink-0" aria-hidden />
              {list.saveCount.toLocaleString('fa-IR')} ذخیره
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
