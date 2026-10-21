'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toLiaraImageSrc } from '@/lib/liara-image-url';
import {
  IMAGE_LOAD_MAX_RETRIES,
  isStorageProxySrc,
  withImageRetryQuery,
} from '@/lib/resilient-image';
import { unwrapStoredImageProxy } from '@/lib/image-url-sanitize';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import {
  isAllowedExternalImageUrl,
  isAllowedItemImageUrl,
  isDisplayableCoverPath,
} from '@/lib/image-url-policy';
import {
  inferCategorySlugFromTitle,
} from '@/lib/category-cover-images';
import { isMovieLikeCategory, resolveItemImage, resolveItemDisplayImage } from '@/lib/resolve-item-image';
import { getItemPlaceholderImageUrl } from '@/lib/item-placeholder-image';
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
  /** @deprecated واکشی TMDB غیرفعال — فقط DB */
  enrichPoster?: boolean;
  /** grid = poster card در لیست */
  coverLayout?: ItemCoverLayout;
  /**
   * والد قبلاً تصمیم گرفته این تصویر نزدیک viewport است.
   * lazy دومِ next/image درخواست را دوباره عقب می‌اندازد.
   */
  eager?: boolean;
  preferPosterEnrich?: boolean;
  /**
   * اگر مقدار بگیرد، تصویر با next/image (fill) رندر و بهینه می‌شود
   * (AVIF/WebP + srcset). والدِ این کامپوننت همیشه relative+sized است.
   * مثال: sizes="(min-width:1024px) 33vw, 50vw"
   */
  sizes?: string;
}

function toItemDisplaySrc(resolved: string): string {
  if (!resolved) return '';
  const unwrapped = unwrapStoredImageProxy(resolved) || resolved;
  if (isOurStorageUrl(unwrapped)) return toLiaraImageSrc(unwrapped, { preferDirect: true });
  if (unwrapped.startsWith('/')) return unwrapped;
  if (isAllowedItemImageUrl(unwrapped)) return unwrapped;
  if (isAllowedExternalImageUrl(unwrapped)) return unwrapped;
  if (isDisplayableCoverPath(unwrapped)) return unwrapped;
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
  sizes,
  eager = false,
}: ItemCoverImageProps) {
  const [fetchedPoster, setFetchedPoster] = useState<string | null>(null);
  // تلاش مجدد از طریق پراکسی same-origin (نه URL مستقیم parspack که ممکن است
  // در شبکهٔ کاربر مسدود باشد و ERR_CONNECTION_REFUSED بدهد).
  const [retrySrc, setRetrySrc] = useState<string | null>(null);
  const [proxyRetry, setProxyRetry] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(priority);

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

  useEffect(() => {
    setFetchedPoster(null);
    setRetrySrc(null);
    setProxyRetry(0);
    setLoadFailed(false);
    setPosterLoading(false);
    setImageLoaded(priority);
  }, [itemId, baseResolved, enrichPoster, priority]);

  const shouldEnrichPoster =
    enrichPoster && !!itemId && isMovieItem && (needsPosterEnrich || loadFailed);

  useEffect(() => {
    if (!shouldEnrichPoster) return;

    let cancelled = false;
    setPosterLoading(true);

    void runPosterEnrichTask(() =>
      fetchItemPosterUrl(itemId, {
        forceEnrich: loadFailed,
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
  }, [shouldEnrichPoster, itemId, loadFailed]);

  const errorFallback = useMemo(
    () =>
      getItemPlaceholderImageUrl({
        seed: itemId ?? title,
        title,
        categorySlug,
      }),
    [itemId, title, categorySlug]
  );

  const resolvedSrc =
    fetchedPoster ||
    (loadFailed && baseResolved
      ? errorFallback
      : loadFailed
        ? displayFallback
        : needsPosterEnrich && !fetchedPoster
          ? displayFallback
          : baseResolved || displayFallback);
  const displaySrc = retrySrc ?? toItemDisplaySrc(resolvedSrc);
  const showFallback = !displaySrc;
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!displaySrc) return;
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [displaySrc, itemId]);

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

  const handleImgError = () => {
    const direct = toItemDisplaySrc(resolvedSrc);
    if (direct && proxyRetry < IMAGE_LOAD_MAX_RETRIES) {
      const next = proxyRetry + 1;
      setProxyRetry(next);
      setRetrySrc(withImageRetryQuery(direct, next));
      setImageLoaded(false);
      return;
    }
    setImageLoaded(false);
    setLoadFailed(true);
  };

  // مسیر next/image فقط با sizes. URL استوریج همین‌جا می‌ماند تا دوباره پروکسی نشود.
  const { src: nextSrc, unoptimized } = !sizes
    ? { src: displaySrc, unoptimized: false }
    : isOurStorageUrl(displaySrc) || isStorageProxySrc(displaySrc)
      ? { src: displaySrc, unoptimized: true }
      : resolveNextImageSrc(displaySrc);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {!imageLoaded && (
        <ItemCoverPlaceholder
          title={title}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon}
          state="loading"
          layout={coverLayout}
          className="absolute inset-0 h-full w-full"
          ariaLabel={`در حال بارگذاری ${title}`}
        />
      )}
      {sizes ? (
        <Image
          key={nextSrc}
          src={nextSrc}
          alt={title}
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          priority={priority}
          loading={priority ? undefined : eager ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : eager ? 'low' : undefined}
          unoptimized={unoptimized}
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={handleImgError}
        />
      ) : (
        <img
          ref={imgRef}
          src={displaySrc}
          alt={title}
          className={`h-full w-full object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority || eager ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : eager ? 'low' : undefined}
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={handleImgError}
        />
      )}
    </div>
  );
}
