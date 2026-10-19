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
      className="border-t border-border px-4 py-4 lg:px-0 lg:py-5"
      aria-labelledby="foryou-title"
    >
      <ExploreSectionTitle
        id="foryou-title"
        title={title}
        subtitle={subtitle}
        iconVariant="forYou"
      />
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-0.5 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-3 lg:overflow-visible lg:snap-none xl:grid-cols-4">
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
              className="block w-44 shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:w-full lg:shrink"
            >
              <Card className="overflow-hidden bg-popover p-0 transition-transform active:scale-95">
                <div className="relative aspect-4/3 bg-muted">
                  <ImageWithFallback
                    src={trustedCover}
                    alt={list.title}
                    className="h-full w-full object-cover"
                    fallbackIcon="📋"
                    fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-xl"
                    width={176}
                    height={132}
                    priority={index === 0}
                    categorySlug={list.category?.slug}
                    listSlug={list.slug}
                    listTitle={list.title}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/75 to-transparent"
                    aria-hidden
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 text-start">
                    <h3 className="line-clamp-2 wibe-small font-semibold text-background">
                      {list.title}
                    </h3>
                  </div>
                </div>
              </Card>
              {categoryLabel ? (
                <p className="mt-1.5 line-clamp-1 wibe-caption text-muted-foreground">
                  {categoryLabel}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
