'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ExploreSectionTitle from './ExploreSectionTitle';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import type { CuratedList } from '@/types/curated';

interface ForYouSectionProps {
  lists: CuratedList[];
  personalized?: boolean;
  diverseCategories?: boolean;
}

/** حداکثر نمایش — بعد از ترند نباید دیوار لیست تکراری بسازد */
const FOR_YOU_DISPLAY_MAX = 6;

function resolveForYouCopy(personalized: boolean, diverseCategories: boolean): {
  title: string;
  subtitle: string;
} {
  if (personalized && diverseCategories) {
    return { title: 'برای تو', subtitle: 'از هر دسته یکی' };
  }
  if (personalized) {
    return { title: 'برای تو', subtitle: 'بر اساس علایق تو' };
  }
  if (diverseCategories) {
    return { title: 'از هر موضوع', subtitle: 'یک پیشنهاد از هر دسته' };
  }
  return { title: 'پیشنهاد وایب', subtitle: 'منتخب برای شروع' };
}

export default function ForYouSection({
  lists,
  personalized = false,
  diverseCategories = false,
}: ForYouSectionProps) {
  if (lists.length === 0) return null;

  const visible = lists.slice(0, FOR_YOU_DISPLAY_MAX);
  const { title, subtitle } = resolveForYouCopy(personalized, diverseCategories);

  return (
    <section
      id="foryou"
      className="border-t border-wibe/60 px-2.5 py-4 lg:px-0 lg:py-5"
      aria-labelledby="foryou-title"
    >
      <ExploreSectionTitle id="foryou-title" title={title} subtitle={subtitle} icon="✨" />
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 xl:grid-cols-3">
        {visible.map((list, index) => {
          const categoryLabel = list.category?.name
            ? `${list.category.icon ? `${list.category.icon} ` : ''}${list.category.name}`
            : getListCardSubtitle(list);
          const trustedCover = resolveCoverImage({
            coverImage: list.coverUrl,
            categorySlug: list.category?.slug,
            listSlug: list.slug,
            listTitle: list.title,
          });
          return (
            <Link
              key={list.id}
              href={`/lists/${list.slug}`}
              className={`group flex flex-row-reverse gap-2.5 rounded-xl border p-2.5 shadow-sm transition-[colors,transform] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:gap-3 lg:p-3 lg:hover:shadow-md ${
                index === 0
                  ? 'border-primary/25 bg-primary/[0.04]'
                  : 'border-wibe bg-wibe-card'
              }`}
            >
              <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-wibe-surface lg:h-20 lg:w-20">
                <ImageWithFallback
                  src={trustedCover}
                  alt={list.title}
                  className="h-full w-full object-cover transition-transform duration-300 lg:group-hover:scale-105"
                  fallbackIcon="📋"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl"
                  width={80}
                  height={80}
                  priority={index === 0}
                  categorySlug={list.category?.slug}
                  listSlug={list.slug}
                  listTitle={list.title}
                />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <h3 className="line-clamp-2 wibe-small font-semibold text-foreground lg:text-base">
                  {list.title}
                </h3>
                {categoryLabel ? (
                  <p className="mt-0.5 line-clamp-1 wibe-caption text-wibe-secondary lg:text-sm">
                    {categoryLabel}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
