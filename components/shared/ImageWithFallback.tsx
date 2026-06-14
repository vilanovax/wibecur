'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toLiaraImageSrc, getLiaraImageMode } from '@/lib/liara-image-url';
import { directStorageFallbackSrc } from '@/lib/resilient-image';
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
import { normalizeImageUrlForStorage } from '@/lib/image-url-sanitize';

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
  /**
   * اگر مقدار بگیرد، تصویر با next/image (fill) رندر می‌شود تا بهینه‌سازی
   * (AVIF/WebP + srcset واکنش‌گرا) فعال شود. لازمهٔ آن این است که والدِ
   * مستقیم `position: relative` و دارای ابعاد باشد. اگر undefined باشد،
   * همان <img> قبلی رندر می‌شود (سازگاری کامل با ۷۲ call-site موجود).
   * مثال: sizes="(min-width:1024px) 25vw, 50vw"
   */
  sizes?: string;
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
  sizes,
}: ImageWithFallbackProps) {
  const [forceLocal, setForceLocal] = useState(false);
  const [forceLiaraProxy, setForceLiaraProxy] = useState(false);
  const [directStorageSrc, setDirectStorageSrc] = useState<string | null>(null);

  useEffect(() => {
    setForceLocal(false);
    setForceLiaraProxy(false);
    setDirectStorageSrc(null);
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
    if (directStorageSrc) return directStorageSrc;
    const base = toDisplaySrc(resolvedSrc);
    if (!base || !forceLiaraProxy || !isOurStorageUrl(resolvedSrc)) return base;
    return toLiaraImageSrc(resolvedSrc, { forceProxy: true });
  }, [resolvedSrc, forceLiaraProxy, directStorageSrc]);

  const fallbackGradient = useMemo(() => {
    const slug =
      categorySlug ??
      inferCategorySlugFromTitle(listTitle) ??
      null;
    const seed = listSlug ?? listTitle ?? slug ?? 'default';
    return pickCategoryCoverGradient(slug, seed);
  }, [categorySlug, listSlug, listTitle]);

  // زنجیرهٔ fallback مشترک بین <img> و next/image:
  // ۱) تلاش با URL مستقیم storage ۲) سوییچ به proxy لیارا ۳) کاور محلی دسته
  const handleError = useCallback(() => {
    if (!directStorageSrc) {
      const direct = directStorageFallbackSrc(displaySrc);
      if (direct) {
        setDirectStorageSrc(direct);
        return;
      }
    }
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
  }, [
    directStorageSrc,
    displaySrc,
    preferStoredImage,
    forceLiaraProxy,
    resolvedSrc,
    forceLocal,
    categorySlug,
    listSlug,
    listTitle,
  ]);

  if (!displaySrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${fallbackGradient} ${className} ${fallbackClassName}`}
      >
        <span className="text-2xl opacity-90 drop-shadow-sm sm:text-3xl">{fallbackIcon}</span>
      </div>
    );
  }

  // مسیر بهینه‌شده — فقط وقتی call-site با دادن `sizes` آن را فعال کرده باشد.
  if (sizes) {
    // به next/image آدرس مستقیم می‌دهیم (نه proxy داخلی) تا خودش بهینه‌سازی کند:
    // proxy داخلی `/api/liara-image?url=...` را به URL اصلی storage باز می‌کنیم؛
    // آن URL از طریق remotePatterns بهینه‌سازی می‌شود (AVIF/WebP + srcset).
    const unwrapped = normalizeImageUrlForStorage(directStorageSrc ?? displaySrc);
    const nextSrc =
      unwrapped && /^https?:\/\//.test(unwrapped) ? unwrapped : (directStorageSrc ?? displaySrc);
    // مسیرهای local دارای query-string را بدون بهینه‌سازی سرو کن تا قانون localPatterns لازم نشود.
    const unoptimized = nextSrc.startsWith('/') && nextSrc.includes('?');
    return (
      <Image
        key={nextSrc}
        src={nextSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        onError={handleError}
        priority={priority}
        unoptimized={unoptimized}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      referrerPolicy="no-referrer"
    />
  );
}
