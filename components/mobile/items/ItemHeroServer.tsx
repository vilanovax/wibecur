import Link from 'next/link';
import Image from 'next/image';
import { List, Star } from 'lucide-react';
import ItemDetailTopActions from '@/components/mobile/items/ItemDetailTopActions';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import { isLocationCategorySlug } from '@/lib/category-layout';
import {
  entryKindBadgeLabel,
  entryKindIcon,
  FACT_TYPE_LABELS,
  isLifestyleCategory,
  isLightweightListItem,
  resolveEntryKind,
  sourceCategorySlugFromItem,
  type FactType,
} from '@/lib/list-entry';
import { resolveImdbRatingDisplay } from '@/lib/item-metadata-display';

export type ItemHeroServerItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  displayImageUrl: string;
  catalogItemId?: string | null;
  rating: number | null;
  voteCount: number | null;
  metadata: Record<string, unknown> | null;
  listRank: number | null;
  listItemCount: number;
  lists: {
    title: string;
    slug: string;
    categories: {
      name: string;
      slug: string;
      icon: string;
    } | null;
  };
};

type ItemHeroServerProps = {
  item: ItemHeroServerItem;
};

export default function ItemHeroServer({ item }: ItemHeroServerProps) {
  const listCategorySlug = item.lists.categories?.slug ?? null;
  const itemCategorySlug =
    sourceCategorySlugFromItem({
      metadata: item.metadata,
      catalogItemId: item.catalogItemId,
    }) ?? listCategorySlug;
  const isLocationPoster = isLocationCategorySlug(itemCategorySlug ?? '');
  const entryKind = resolveEntryKind(item);
  const isLightweight = isLightweightListItem(item);
  const isLifestyle = isLifestyleCategory(listCategorySlug);
  const meta = (item.metadata || {}) as Record<string, string | number>;
  const year = meta.year ?? null;
  const categoryName = item.lists.categories?.name ?? null;
  const imdbRating = resolveImdbRatingDisplay(item.metadata, item.rating);
  const genre = meta.genre ?? categoryName;
  const likeCount = item.voteCount ?? 0;
  const factTypeRaw = item.metadata?.factType;
  const factLabel =
    typeof factTypeRaw === 'string'
      ? FACT_TYPE_LABELS[factTypeRaw as FactType] ?? factTypeRaw
      : null;

  if (isLightweight) {
    return (
      <section
        className={`relative overflow-hidden rounded-b-2xl px-4 pb-5 pt-4 lg:rounded-2xl lg:px-6 lg:pb-6 lg:pt-5 ${
          isLifestyle
            ? 'bg-wibe-surface'
            : 'bg-gradient-to-br from-amber-50 via-white to-wibe-surface'
        }`}
      >
        <Link
          href={`/lists/${item.lists.slug}`}
          className="mb-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-wibe-card px-2.5 py-1 wibe-caption font-medium text-wibe-secondary shadow-sm ring-1 ring-wibe/80"
        >
          <List className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{item.lists.title}</span>
        </Link>

        {isLifestyle ? (
          item.title?.trim() && (
            <h1 className="wibe-h1 leading-snug">
              {item.title}
            </h1>
          )
        ) : (
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-amber-200/70">
              {entryKindIcon(entryKind)}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="inline-flex rounded-md bg-white/90 px-2 py-0.5 wibe-caption font-semibold text-wibe-secondary shadow-sm">
                  {entryKindBadgeLabel(entryKind)}
                </span>
                {factLabel && (
                  <span className="inline-flex rounded-md bg-white/90 px-2 py-0.5 wibe-caption font-semibold text-wibe-secondary shadow-sm">
                    {factLabel}
                  </span>
                )}
              </div>
              {item.title?.trim() && (
                <h1 className="wibe-h1 leading-snug">
                  {item.title}
                </h1>
              )}
            </div>
          </div>
        )}
      </section>
    );
  }

  const posterSrc = item.displayImageUrl || item.imageUrl;
  const poster = posterSrc ? resolveNextImageSrc(posterSrc) : null;

  return (
    <section className="px-4 pt-2 lg:px-0 lg:pt-1">
      <div className="flex gap-3.5 sm:gap-4 lg:grid lg:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-6">
        <div
          className={`relative shrink-0 overflow-hidden rounded-2xl bg-wibe-surface shadow-sm ring-1 ring-wibe/90 ${
            isLocationPoster
              ? 'h-[7.25rem] w-[6.5rem] sm:h-32 sm:w-[8.5rem] lg:h-auto lg:w-full lg:aspect-[4/3]'
              : 'h-[10.75rem] w-[7.25rem] sm:h-[12rem] sm:w-32 lg:h-auto lg:w-full lg:aspect-[2/3]'
          }`}
        >
          {poster ? (
            <Image
              src={poster.src}
              alt={item.title}
              fill
              priority
              sizes="(min-width: 1280px) 15rem, (min-width: 1024px) 14rem, 7rem"
              className={
                isLocationPoster
                  ? 'object-cover object-center'
                  : 'object-cover object-center bg-wibe-surface'
              }
              unoptimized={poster.unoptimized}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl opacity-40">
              {item.lists.categories?.icon || '📋'}
            </div>
          )}
          {imdbRating && (
            <span className="absolute bottom-2 end-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/80 px-2 py-1 wibe-caption font-bold text-white shadow-sm backdrop-blur-sm">
              <Star className="h-3 w-3 shrink-0 fill-warning text-warning" aria-hidden />
              <span className="tabular-nums text-warning">{imdbRating}</span>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-end lg:justify-center lg:py-1">
          <Link
            href={`/lists/${item.lists.slug}`}
            className="mb-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-wibe bg-wibe-card px-2.5 py-1 wibe-caption font-medium text-wibe-secondary transition-colors hover:border-primary/25 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mb-3"
          >
            <span aria-hidden>{item.lists.categories?.icon || '📋'}</span>
            <span className="truncate">{item.lists.title}</span>
          </Link>

          <h1 className="wibe-h1 leading-snug">
            {item.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 wibe-caption text-wibe-secondary">
            {(genre || categoryName) && (
              <span className="rounded-full bg-wibe-surface px-2 py-0.5 font-medium text-foreground/80">
                {String(genre || categoryName)}
              </span>
            )}
            {year != null && (
              <span className="rounded-full bg-wibe-surface px-2 py-0.5 tabular-nums font-medium text-foreground/80">
                {String(year)}
              </span>
            )}
          </div>

          <div className="mt-4 hidden lg:block">
            <ItemDetailTopActions
              itemId={item.id}
              likeCount={likeCount}
              catalogItemId={item.catalogItemId}
              shareTitle={item.title}
              variant="inline"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
