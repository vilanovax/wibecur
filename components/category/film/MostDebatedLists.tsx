'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from '../CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';
import { FILM_SECTION } from './film-layout';

interface MostDebatedListsProps {
  lists: CategoryListCard[];
}

function DebatedListCard({ list }: { list: CategoryListCard }) {
  const poster = list.bannerImage ?? list.coverImage;

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group flex items-stretch gap-3 overflow-hidden rounded-xl border border-wibe bg-wibe-card p-3 shadow-sm transition-all active:scale-[0.99] lg:gap-4 lg:rounded-2xl lg:p-4 lg:hover:border-primary/20 lg:hover:shadow-md"
    >
      <div className="relative w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-gray-800 lg:w-[5.5rem]">
        <div className="aspect-[2/3]">
          {poster ? (
            <ImageWithFallback
              src={poster}
              alt={list.title}
              className="h-full w-full object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-[1.03]"
              placeholderSize="square"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-800 text-3xl opacity-60">
              🎬
            </div>
          )}
        </div>
        {(list.commentCount ?? 0) > 0 && (
          <span className="absolute left-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 wibe-caption font-bold text-white">
            💬 {(list.commentCount ?? 0).toLocaleString('fa-IR')}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center text-right">
        <h3 className="line-clamp-2 font-semibold text-foreground text-base lg:wibe-body lg:leading-snug">
          {list.title}
        </h3>
        {list.description && (
          <p className="mt-1 line-clamp-2 wibe-caption text-wibe-secondary">
            {list.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 wibe-caption text-wibe-secondary">
          <span>💬 {(list.commentCount ?? 0).toLocaleString('fa-IR')} نظر</span>
          <span>🔥 {list.likeCount.toLocaleString('fa-IR')} واکنش</span>
          <ListCardStats saves={list.saveCount} itemCount={list.itemCount} />
        </div>
        {list.creator?.name && (
          <p className="mt-1.5 wibe-caption text-wibe-secondary/80">
            {list.creator.name}
          </p>
        )}
      </div>
    </Link>
  );
}

/** لیست‌های با بیشترین نظر و گفتگو */
export default function MostDebatedLists({ lists }: MostDebatedListsProps) {
  if (lists.length === 0) return null;

  return (
    <section className={FILM_SECTION}>
      <CategorySectionTitle
        title="پربحث‌ترین لیست‌ها"
        subtitle="بیشترین گفتگو در ۷ روز گذشته"
        iconVariant="debate"
      />

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {lists.map((list) => (
          <DebatedListCard key={list.id} list={list} />
        ))}
      </div>
    </section>
  );
}
