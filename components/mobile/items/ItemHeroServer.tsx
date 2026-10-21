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
import { fa } from '@/lib/utils';

export type ItemHeroServerItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  displayImageUrl: string;
  catalogItemId?: string | null;
  rating: number | null;
  voteCount: number | null;
  metadata: Record<string, unknown> | null;
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
        className="relative overflow-hidden rounded-b-xl bg-muted/40 px-4 pb-5 pt-4 lg:rounded-xl lg:px-6 lg:pb-6 lg:pt-5"
      >
        <Link
          href={`/lists/${item.lists.slug}`}
          className="mb-3 inline-flex min-h-11 max-w-full items-center rounded-full border border-border bg-popover px-3"
        >
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <List className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{item.lists.title}</span>
          </span>
        </Link>

        {isLifestyle ? (
          item.title?.trim() && (
            <h1 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
              {item.title}
            </h1>
          )
        ) : (
          <div className="flex items-start gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-surface bg-popover text-3xl shadow-sm ring-1 ring-border">
              {entryKindIcon(entryKind)}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="inline-flex min-h-8 items-center rounded-full bg-popover px-3 text-sm font-semibold text-muted-foreground">
                  {entryKindBadgeLabel(entryKind)}
                </span>
                {factLabel && (
                  <span className="inline-flex min-h-8 items-center rounded-full bg-popover px-3 text-sm font-semibold text-muted-foreground">
                    {factLabel}
                  </span>
                )}
              </div>
              {item.title?.trim() && (
                <h1 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
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
          className={`relative shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm ${
            isLocationPoster
              ? 'h-[7.25rem] w-[6.5rem] sm:h-32 sm:w-[8.5rem] lg:h-auto lg:w-full lg:aspect-[4/3]'
              : 'h-[10.5rem] w-[7rem] sm:h-[11.5rem] sm:w-[7.75rem] lg:h-auto lg:w-full lg:aspect-[2/3]'
          }`}
        >
          {poster ? (
            <Image
              src={poster.src}
              alt={item.title}
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1280px) 15rem, (min-width: 1024px) 14rem, 7rem"
              className={
                isLocationPoster
                  ? 'object-cover object-center'
                  : 'object-contain bg-muted'
              }
              unoptimized={poster.unoptimized}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl opacity-40">
              {item.lists.categories?.icon || '📋'}
            </div>
          )}
          {imdbRating && (
            <span className="absolute bottom-2 end-2 z-10 inline-flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-1 text-xs font-bold backdrop-blur-sm">
              <Star className="h-3 w-3 shrink-0 fill-warning text-warning" aria-hidden />
              <span className="text-warning tabular-nums">{fa(imdbRating)}</span>
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-end lg:justify-center lg:py-1">
          <Link
            href={`/lists/${item.lists.slug}`}
            className="mb-2 inline-flex min-h-11 max-w-full items-center rounded-control border border-border bg-popover px-3 transition-colors hover:border-brand/30 lg:mb-3"
          >
            <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <span aria-hidden>{item.lists.categories?.icon || '📋'}</span>
              <span className="truncate">{item.lists.title}</span>
            </span>
          </Link>

          <h1 className="text-lg font-bold leading-snug text-foreground sm:text-xl lg:wibe-h1 lg:leading-snug">
            {item.title}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground lg:mt-2 lg:text-sm">
            {(genre || categoryName) && <span>{String(genre || categoryName)}</span>}
            {year != null && (
              <>
                {(genre || categoryName) && <span className="text-muted-foreground/40">·</span>}
                <span>{fa(String(year))}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 lg:mt-4 lg:max-w-md">
        <ItemDetailTopActions
          itemId={item.id}
          likeCount={likeCount}
          catalogItemId={item.catalogItemId}
          shareTitle={item.title}
          variant="inline"
        />
      </div>
    </section>
  );
}
