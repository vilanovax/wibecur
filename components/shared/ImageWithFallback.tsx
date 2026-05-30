'use client';

import { useMemo, useState } from 'react';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toLiaraImageSrc } from '@/lib/liara-image-url';
import { resolveCoverImage } from '@/lib/resolve-cover-image';
import { isAllowedExternalImageUrl, isDisplayableCoverPath, isGenericListCover } from '@/lib/image-url-policy';
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
}

function toDisplaySrc(resolved: string): string {
  if (!isDisplayableCoverPath(resolved)) return '';
  if (resolved.startsWith('/')) return resolved;
  if (isOurStorageUrl(resolved)) return toLiaraImageSrc(resolved);
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
}: ImageWithFallbackProps) {
  const [forceLocal, setForceLocal] = useState(false);

  const resolvedSrc = useMemo(() => {
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
  }, [src, categorySlug, listSlug, listTitle, forceLocal]);

  const displaySrc = toDisplaySrc(resolvedSrc);

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
        if (!forceLocal && (categorySlug || listSlug || listTitle)) {
          setForceLocal(true);
          return;
        }
      }}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      referrerPolicy="no-referrer"
    />
  );
}
