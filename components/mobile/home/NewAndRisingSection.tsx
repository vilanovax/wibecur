'use client';

import Link from 'next/link';
import { TrendingUp, Bookmark } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { useHomeData } from '@/contexts/HomeDataContext';
import { HOME_FEED_GRID_CLASS } from '@/lib/layout-tokens';
import HomeSectionTitle from './HomeSectionTitle';
import HomeGridListCard from './HomeGridListCard';

export default function NewAndRisingSection({ embedded = false }: { embedded?: boolean }) {
  const { data, isLoading } = useHomeData();
  const lists = (data?.rising ?? []).slice(0, 8);

  if (isLoading && lists.length === 0) {
    return (
      <section className={embedded ? '' : 'mb-6'}>
        {!embedded && (
          <div className="mb-3 px-4">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        )}
        <div className="space-y-3 px-4 lg:px-0">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100 lg:h-36" />
          ))}
        </div>
      </section>
    );
  }

  if (lists.length === 0) {
    return embedded ? (
      <p className="px-4 py-6 text-center wibe-small text-wibe-secondary lg:px-0">
        فعلاً لیست اوج‌گیری نیست
      </p>
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

      <div className="space-y-2 px-4 lg:hidden">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex flex-row-reverse gap-3 overflow-hidden rounded-lg border border-wibe bg-wibe-card p-3 shadow-sm transition-transform active:scale-[0.99]"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200">
              <ImageWithFallback
                src={list.coverImage}
                alt={list.title}
                className="h-full w-full object-cover"
                fallbackIcon={list.categories?.icon ?? '📋'}
                fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200"
                categorySlug={list.categories?.slug}
                listSlug={list.slug}
                listTitle={list.title}
              />
              {(list as { isFastRising?: boolean }).isFastRising && (
                <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-pill bg-success px-1.5 py-0.5 wibe-caption font-semibold text-white">
                  <TrendingUp className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">
                {list.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 wibe-caption text-wibe-secondary">
                <Bookmark className="h-3.5 w-3.5 text-primary" />
                {list.saveCount.toLocaleString('fa-IR')} ذخیره · {list.itemCount} آیتم
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div
        className={`hidden lg:grid lg:overflow-visible lg:snap-none lg:px-0 ${HOME_FEED_GRID_CLASS}`}
      >
        {lists.map((list) => (
          <HomeGridListCard
            key={list.id}
            list={list}
            badge={(list as { isFastRising?: boolean }).isFastRising ? 'سریع' : null}
            badgeClassName="bg-success text-white"
          />
        ))}
      </div>
    </section>
  );
}
