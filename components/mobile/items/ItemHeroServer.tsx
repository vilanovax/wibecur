import Link from 'next/link';
import Image from 'next/image';
import { List } from 'lucide-react';
import ItemDetailTopActions from '@/components/mobile/items/ItemDetailTopActions';
import ItemShareButton from '@/components/mobile/items/ItemShareButton';
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

function displayRating(rating: number | null | undefined): string | null {
  if (rating == null || Number(rating) === 0) return null;
  return String(rating);
}

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
  const ratingLabel = displayRating(
    item.rating ?? (meta.imdbRating as number | undefined) ?? null
  );
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
            : 'bg-gradient-to-br from-amber-50 via-white to-violet-50'
        }`}
      >
        <ItemShareButton
          title={item.title}
          className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm transition-colors hover:bg-white active:scale-95"
          iconClassName="h-4 w-4"
        />

        <Link
          href={`/lists/${item.lists.slug}`}
          className="mb-3 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 wibe-caption font-medium text-wibe-secondary shadow-sm"
        >
          <List className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{item.lists.title}</span>
        </Link>

        {isLifestyle ? (
          item.title?.trim() && (
            <h1 className="pe-12 text-xl font-bold leading-snug text-foreground sm:text-2xl">
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
                  <span className="inline-flex rounded-md bg-violet-50 px-2 py-0.5 wibe-caption font-semibold text-violet-700">
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

  return (
    <section className="px-4 pt-2 lg:px-0 lg:pt-1">
      <div className="flex gap-3.5 sm:gap-4 lg:grid lg:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)] lg:items-start lg:gap-5 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-6">
        <div
          className={`relative shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-black/[0.05] lg:rounded-2xl ${
            isLocationPoster
              ? 'h-[7.25rem] w-[6.5rem] sm:h-32 sm:w-[8.5rem] lg:h-auto lg:w-full lg:aspect-[4/3]'
              : 'h-[10.5rem] w-[7rem] sm:h-[11.5rem] sm:w-[7.75rem] lg:h-auto lg:w-full lg:aspect-[2/3]'
          }`}
        >
          {posterSrc ? (
            <Image
              src={posterSrc}
              alt={item.title}
              fill
              priority
              sizes="(min-width: 1280px) 15rem, (min-width: 1024px) 14rem, 7rem"
              className={
                isLocationPoster
                  ? 'object-cover object-center'
                  : 'object-contain bg-gray-100'
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl opacity-40">
              {item.lists.categories?.icon || '📋'}
            </div>
          )}
          <ItemShareButton
            title={item.title}
            className="absolute end-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/55 active:scale-95 lg:end-2.5 lg:top-2.5 lg:h-9 lg:w-9"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-end lg:justify-center lg:py-1">
          <Link
            href={`/lists/${item.lists.slug}`}
            className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-wibe/80 bg-wibe-card px-2.5 py-1 wibe-caption font-medium text-wibe-secondary transition-colors hover:border-primary/25 hover:text-primary lg:mb-3"
          >
            <span aria-hidden>{item.lists.categories?.icon || '📋'}</span>
            <span className="truncate">{item.lists.title}</span>
          </Link>

          <h1 className="text-lg font-bold leading-snug text-foreground sm:text-xl lg:text-[1.65rem] lg:leading-snug">
            {item.title}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 wibe-caption text-wibe-secondary lg:mt-2 lg:text-sm">
            {(genre || categoryName) && <span>{String(genre || categoryName)}</span>}
            {year != null && (
              <>
                {(genre || categoryName) && <span className="text-wibe-secondary/40">·</span>}
                <span>{String(year)}</span>
              </>
            )}
            {ratingLabel && (
              <>
                <span className="text-wibe-secondary/40">·</span>
                <span>⭐ {ratingLabel}</span>
              </>
            )}
            {item.listRank != null && item.listItemCount > 0 && (
              <>
                <span className="text-wibe-secondary/40">·</span>
                <span>
                  #{item.listRank.toLocaleString('fa-IR')} از{' '}
                  {item.listItemCount.toLocaleString('fa-IR')}
                </span>
              </>
            )}
          </div>

          <div className="mt-3 hidden lg:block">
            <ItemDetailTopActions
              itemId={item.id}
              likeCount={likeCount}
              catalogItemId={item.catalogItemId}
              variant="inline"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
