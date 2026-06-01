'use client';

import { useEffect, useMemo, useState } from 'react';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toLiaraImageSrc } from '@/lib/liara-image-url';
import {
  isAllowedExternalImageUrl,
  isAllowedItemImageUrl,
  isDisplayableCoverPath,
} from '@/lib/image-url-policy';
import {
  inferCategorySlugFromTitle,
} from '@/lib/category-cover-images';
import { isMovieLikeCategory, resolveItemImage, resolveItemDisplayImage } from '@/lib/resolve-item-image';
import { itemNeedsPosterEnrich } from '@/lib/item-poster-needs-enrich';
import { fetchItemPosterUrl, runPosterEnrichTask } from '@/lib/poster-enrich-queue';
import ItemCoverPlaceholder, {
  type ItemCoverLayout,
  type ItemCoverPlaceholderState,
} from '@/components/shared/ItemCoverPlaceholder';

export interface ItemCoverImageProps {
  itemId?: string;
  imageUrl?: string | null;
  title: string;
  metadata?: Record<string, unknown> | null;
  categorySlug?: string | null;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
  priority?: boolean;
  /** واکشی poster از TMDB اگر خالی باشد */
  enrichPoster?: boolean;
  /** grid = poster card در لیست */
  coverLayout?: ItemCoverLayout;
  /** preview: Liara را رد کن و مستقیم TMDB */
  preferPosterEnrich?: boolean;
}

function toItemDisplaySrc(resolved: string): string {
  if (!resolved) return '';
  if (resolved.startsWith('/')) return resolved;
  if (isOurStorageUrl(resolved)) return toLiaraImageSrc(resolved);
  if (isAllowedItemImageUrl(resolved)) return resolved;
  if (isAllowedExternalImageUrl(resolved)) return resolved;
  if (isDisplayableCoverPath(resolved)) return resolved;
  return '';
}

export default function ItemCoverImage({
  itemId,
  imageUrl,
  title,
  metadata,
  categorySlug,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
  priority = false,
  enrichPoster = false,
  coverLayout = 'default',
  preferPosterEnrich = false,
}: ItemCoverImageProps) {
  const [fetchedPoster, setFetchedPoster] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const baseResolved = useMemo(
    () =>
      resolveItemImage({
        imageUrl,
        title,
        metadata,
        categorySlug,
      }),
    [imageUrl, title, metadata, categorySlug]
  );

  const displayFallback = useMemo(
    () =>
      resolveItemDisplayImage({
        id: itemId,
        imageUrl,
        title,
        metadata,
        categorySlug,
      }),
    [itemId, imageUrl, title, metadata, categorySlug]
  );

  const isMovieItem = useMemo(
    () =>
      isMovieLikeCategory(categorySlug) || isMovieLikeCategory(inferCategorySlugFromTitle(title)),
    [categorySlug, title]
  );

  const needsPosterEnrich = useMemo(
    () =>
      Boolean(
        enrichPoster &&
          isMovieItem &&
          itemId &&
          itemNeedsPosterEnrich({
            title,
            imageUrl,
            metadata,
            categorySlug,
          })
      ),
    [enrichPoster, isMovieItem, itemId, title, imageUrl, metadata, categorySlug]
  );

  const skippedStorageForEnrich = useMemo(
    () =>
      Boolean(
        enrichPoster &&
          isMovieItem &&
          baseResolved &&
          isOurStorageUrl(baseResolved)
      ),
    [enrichPoster, isMovieItem, baseResolved]
  );

  const effectiveBaseResolved = skippedStorageForEnrich ? '' : baseResolved;

  useEffect(() => {
    setFetchedPoster(null);
    setLoadFailed(false);
    setPosterLoading(false);
    setImageLoaded(false);
  }, [itemId, baseResolved, enrichPoster]);

  const shouldEnrichPoster =
    enrichPoster && !!itemId && isMovieItem && (needsPosterEnrich || loadFailed);

  useEffect(() => {
    if (!shouldEnrichPoster) return;

    let cancelled = false;
    setPosterLoading(true);

    void runPosterEnrichTask(() =>
      fetchItemPosterUrl(itemId, {
        forceEnrich: loadFailed || skippedStorageForEnrich,
      })
    )
      .then((posterUrl) => {
        if (cancelled || !posterUrl) return;
        setFetchedPoster(posterUrl);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPosterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldEnrichPoster, itemId, loadFailed, skippedStorageForEnrich]);

  const resolvedSrc =
    fetchedPoster ||
    (loadFailed
      ? displayFallback
      : needsPosterEnrich && !fetchedPoster
        ? displayFallback
        : effectiveBaseResolved || displayFallback);
  const displaySrc = toItemDisplaySrc(resolvedSrc);
  const showFallback = !displaySrc;

  const resolvedPlaceholderState: ItemCoverPlaceholderState = posterLoading ? 'loading' : 'empty';

  if (showFallback) {
    return (
      <ItemCoverPlaceholder
        title={title}
        categorySlug={categorySlug}
        fallbackIcon={fallbackIcon}
        state={resolvedPlaceholderState}
        layout={coverLayout}
        className={`${className} ${fallbackClassName}`}
        ariaLabel={title}
      />
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {!imageLoaded && (
        <ItemCoverPlaceholder
          title={title}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon}
          state={posterLoading ? 'loading' : 'loading'}
          layout={coverLayout}
          className="absolute inset-0 h-full w-full"
          ariaLabel={`در حال بارگذاری ${title}`}
        />
      )}
      <img
        src={displaySrc}
        alt={title}
        className={`h-full w-full object-cover transition-opacity duration-300 ease-out ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        referrerPolicy="no-referrer"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageLoaded(false);
          setLoadFailed(true);
        }}
      />
    </div>
  );
}
