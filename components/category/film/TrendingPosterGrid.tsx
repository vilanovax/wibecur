'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from '../CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';
import { FILM_SECTION } from './film-layout';

const DISPLAY_LIMIT = 12;

interface TrendingPosterGridProps {
  lists: CategoryListCard[];
  categorySlug: string;
}

function TrendingPosterCard({ list }: { list: CategoryListCard }) {
  const weeklySaves = list.saves7d ?? list.saves24h;

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block shrink-0 snap-start active:scale-[0.99] transition-transform lg:shrink lg:hover:-translate-y-0.5"
    >
      <div className="relative overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-card lg:rounded-2xl lg:shadow-sm lg:transition-shadow lg:group-hover:shadow-lg">
        <div className="relative aspect-[2/3] bg-gray-800 lg:aspect-[3/4]">
          {list.coverImage ? (
            <ImageWithFallback
              src={list.coverImage}
              alt={list.title}
              className="h-full w-full object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-[1.03]"
              placeholderSize="square"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-800 text-5xl opacity-50">
              🎬
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent lg:from-black/80" />
          {(list.badge === 'viral' || list.badge === 'hot') && (
            <span className="absolute right-2 top-2 rounded-pill bg-warning px-2 py-0.5 wibe-caption font-semibold text-white">
              ترند
            </span>
          )}
          {weeklySaves != null && weeklySaves > 0 && (
            <span className="absolute left-2 top-2 rounded-lg bg-orange-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              +{weeklySaves.toLocaleString('fa-IR')}
            </span>
          )}
          <div className="absolute bottom-2 left-2 right-2 lg:bottom-3 lg:left-3 lg:right-3">
            <h3 className="line-clamp-2 wibe-small font-semibold text-white lg:text-[15px] lg:leading-snug">
              {list.title}
            </h3>
            <ListCardStats
              saves={list.saveCount}
              itemCount={list.itemCount}
              periodSaves={weeklySaves}
              periodLabel={list.saves7d != null ? 'این هفته' : '۲۴ساعت'}
              variant="overlay"
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TrendingPosterGrid({
  lists,
  categorySlug,
}: TrendingPosterGridProps) {
  if (lists.length === 0) return null;

  const visible = lists.slice(0, DISPLAY_LIMIT);

  return (
    <section className={FILM_SECTION}>
      <div className="mb-3 flex items-end justify-between gap-3 lg:mb-4">
        <CategorySectionTitle
          title="داغ‌ترین لیست‌های هفته"
          subtitle="بر اساس تعامل ۷ روزه"
          icon="🔥"
          className="mb-0"
        />
        <Link
          href={`/lists?category=${categorySlug}`}
          className="inline-flex shrink-0 pb-0.5 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
        >
          مشاهده همه
        </Link>
      </div>

      {/* موبایل: کاروسل افقی */}
      <div
        dir="rtl"
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide snap-x snap-mandatory lg:hidden"
      >
        {visible.map((list) => (
          <div key={list.id} className="w-[42vw] max-w-[168px] min-w-[132px]">
            <TrendingPosterCard list={list} />
          </div>
        ))}
      </div>

      {/* دسکتاپ: گرید ۴ ستونه */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-4">
        {visible.map((list) => (
          <TrendingPosterCard key={list.id} list={list} />
        ))}
      </div>
    </section>
  );
}
