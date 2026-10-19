'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { isOurStorageUrl, isLegacyLiaraStorageUrl } from '@/lib/object-storage-config';
import { unwrapStoredImageProxy } from '@/lib/image-url-sanitize';
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
import { resolveNextImageSrc } from '@/lib/next-image-src';

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
  /**
   * برای تصاویر با ابعاد ثابت (مثل آواتار). اگر هر دو داده شوند، next/image با
   * width/height مشخص رندر می‌شود (نه fill) — مستقل از positioning والد و امن.
   */
  width?: number;
  height?: number;
}

function toDisplaySrc(resolved: string): string {
  const unwrapped = unwrapStoredImageProxy(resolved) || resolved;
  if (!unwrapped || unwrapped.startsWith('/api/liara-image') || unwrapped.startsWith('/api/storage-image')) {
    return '';
  }
  if (!isDisplayableCoverPath(unwrapped)) return '';
  if (isOurStorageUrl(unwrapped) || isLegacyLiaraStorageUrl(unwrapped)) return unwrapped;
  if (unwrapped.startsWith('/')) return unwrapped;
  if (isAllowedItemImageUrl(unwrapped)) return unwrapped;
  if (isAllowedExternalImageUrl(unwrapped)) return unwrapped;
  return '';
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
  placeholderSize = 'cover',
  priority = false,
  categorySlug,
  listSlug,
  listTitle,
  preferStoredImage = false,
  itemImageSource,
  sizes,
  width,
  height,
}: ImageWithFallbackProps) {
  const [forceLocal, setForceLocal] = useState(false);
  const [directStorageSrc, setDirectStorageSrc] = useState<string | null>(null);

  useEffect(() => {
    setForceLocal(false);
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
    return toDisplaySrc(resolvedSrc);
  }, [resolvedSrc, directStorageSrc]);

  const fallbackGradient = useMemo(() => {
    const slug =
      categorySlug ??
      inferCategorySlugFromTitle(listTitle) ??
      null;
    const seed = listSlug ?? listTitle ?? slug ?? 'default';
    return pickCategoryCoverGradient(slug, seed);
  }, [categorySlug, listSlug, listTitle]);

  const handleError = useCallback(() => {
    if (!directStorageSrc) {
      const direct = directStorageFallbackSrc(displaySrc);
      if (direct) {
        setDirectStorageSrc(direct);
        return;
      }
    }
    if (!forceLocal && (categorySlug || listSlug || listTitle) && !preferStoredImage) {
      setForceLocal(true);
    }
  }, [
    directStorageSrc,
    displaySrc,
    preferStoredImage,
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

  // مسیر بهینه‌شدهٔ ابعاد-ثابت (آواتارها) — مستقل از positioning والد.
  if (width && height && !sizes) {
    const { src: imageSrc, unoptimized: unoptimizedFixed } = resolveNextImageSrc(
      directStorageSrc ?? displaySrc
    );
    return (
      <Image
        key={imageSrc}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        priority={priority}
        unoptimized={unoptimizedFixed}
        referrerPolicy="no-referrer"
      />
    );
  }

  // مسیر بهینه‌شده — فقط وقتی call-site با دادن `sizes` آن را فعال کرده باشد.
  if (sizes) {
    const { src: nextSrc, unoptimized } = resolveNextImageSrc(directStorageSrc ?? displaySrc);
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

  // ابعاد intrinsic برای کاهش CLS وقتی والد با CSS اندازه می‌دهد.
  // displaySrc اینجا همیشه truthy است (بالا early-return روی خالی).
  const intrinsicW = width ?? (placeholderSize === 'square' ? 400 : 600);
  const intrinsicH = height ?? (placeholderSize === 'square' ? 400 : 400);

  return (
    <img
      src={displaySrc}
      alt={alt}
      width={intrinsicW}
      height={intrinsicH}
      className={className}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
