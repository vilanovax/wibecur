'use client';

import { useEffect, useMemo, useState } from 'react';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toLiaraImageSrc, getLiaraImageMode } from '@/lib/liara-image-url';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import {
  isAllowedExternalImageUrl,
  isAllowedItemImageUrl,
  isDisplayableCoverPath,
  isGenericListCover,
} from '@/lib/image-url-policy';
import { resolveItemImage, type ItemImageSource } from '@/lib/resolve-item-image';
import {
  inferCategorySlugFromTitle,
  pickCategoryCoverGradient,
} from '@/lib/category-cover-images';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
  placeholderSize?: 'cover' | 'square';
  priority?: boolean;
  /** slug دسته برای کاور متناسب (مثلاً books, movies) */
  categorySlug?: string | null;
  /** slug لیست برای کاور موضوعی (مثلاً personal-development-books) */
  listSlug?: string | null;
  listTitle?: string | null;
  /** نمایش تصویر ذخیره‌شده (Liara/OMDb) — URL مستقیم بدون proxy */
  preferStoredImage?: boolean;
  /** برای poster آیتم — imageUrl + metadata.posterUrl و … */
  itemImageSource?: Omit<ItemImageSource, 'id'>;
}

function toDisplaySrc(resolved: string): string {
  if (!isDisplayableCoverPath(resolved)) return '';
  if (resolved.startsWith('/')) return resolved;
  if (isOurStorageUrl(resolved)) return toLiaraImageSrc(resolved);
  if (isAllowedItemImageUrl(resolved)) return resolved;
  if (isAllowedExternalImageUrl(resolved)) return resolved;
  return '';
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
  priority = false,
  categorySlug,
  listSlug,
  listTitle,
  preferStoredImage = false,
  itemImageSource,
}: ImageWithFallbackProps) {
  const [forceLocal, setForceLocal] = useState(false);
  const [forceLiaraProxy, setForceLiaraProxy] = useState(false);

  useEffect(() => {
    setForceLocal(false);
    setForceLiaraProxy(false);
  }, [src, preferStoredImage, categorySlug, listSlug, listTitle, itemImageSource]);

  const resolvedSrc = useMemo(() => {
    if (preferStoredImage) {
      if (itemImageSource) {
        return resolveItemImage({
          ...itemImageSource,
          imageUrl: itemImageSource.imageUrl ?? src,
        });
      }
      return src;
    }

    const shouldResolveCover =
      forceLocal ||
      Boolean(categorySlug || listSlug || listTitle) ||
      isGenericListCover(src);

    if (!shouldResolveCover) return src;

    return resolveCoverImage({
      coverImage: forceLocal ? '' : src,
      categorySlug,
      listSlug,
      listTitle,
    });
  }, [src, categorySlug, listSlug, listTitle, forceLocal, preferStoredImage, itemImageSource]);

  const displaySrc = useMemo(() => {
    const base = toDisplaySrc(resolvedSrc);
    if (!base || !forceLiaraProxy || !isOurStorageUrl(resolvedSrc)) return base;
    return toLiaraImageSrc(resolvedSrc, { forceProxy: true });
  }, [resolvedSrc, forceLiaraProxy]);

  const fallbackGradient = useMemo(() => {
    const slug =
      categorySlug ??
      inferCategorySlugFromTitle(listTitle) ??
      null;
    const seed = listSlug ?? listTitle ?? slug ?? 'default';
    return pickCategoryCoverGradient(slug, seed);
  }, [categorySlug, listSlug, listTitle]);

  if (!displaySrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${fallbackGradient} ${className} ${fallbackClassName}`}
      >
        <span className="text-2xl opacity-90 drop-shadow-sm sm:text-3xl">{fallbackIcon}</span>
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={() => {
        if (
          preferStoredImage &&
          !forceLiaraProxy &&
          isOurStorageUrl(resolvedSrc) &&
          getLiaraImageMode() === 'direct'
        ) {
          setForceLiaraProxy(true);
          return;
        }
        if (!forceLocal && (categorySlug || listSlug || listTitle) && !preferStoredImage) {
          setForceLocal(true);
        }
      }}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      referrerPolicy="no-referrer"
    />
  );
}
