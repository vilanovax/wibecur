'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ExploreSectionTitle from './ExploreSectionTitle';
import { getListCardSubtitle } from '@/lib/lists-card-utils';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import type { CuratedList } from '@/types/curated';
import { Card } from '@/components/ui/card';

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
      className="border-t border-border px-3 py-4 lg:px-0 lg:py-5"
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
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Card
                className={`flex gap-3 p-3 transition-transform active:scale-95 ${
                  index === 0 ? 'border-brand/30 bg-brand/5' : 'bg-popover'
                }`}
              >
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted lg:size-20">
                <ImageWithFallback
                  src={trustedCover}
                  alt={list.title}
                  className="h-full w-full object-cover transition-transform duration-300 lg:group-hover:scale-105"
                  fallbackIcon="📋"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-xl"
                  width={80}
                  height={80}
                  priority={index === 0}
                  categorySlug={list.category?.slug}
                  listSlug={list.slug}
                  listTitle={list.title}
                />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <h3 className="line-clamp-2 wibe-small font-semibold text-foreground lg:text-base">
                  {list.title}
                </h3>
                {categoryLabel ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground lg:text-sm">
                    {categoryLabel}
                  </p>
                ) : null}
              </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
