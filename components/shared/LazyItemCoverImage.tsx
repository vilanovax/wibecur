'use client';

import type { RefObject } from 'react';
import ItemCoverImage, { type ItemCoverImageProps } from '@/components/shared/ItemCoverImage';
import ItemCoverPlaceholder from '@/components/shared/ItemCoverPlaceholder';
import { useLazyInView } from '@/hooks/useLazyInView';

type LazyItemCoverImageProps = ItemCoverImageProps & {
  rootMargin?: string;
  /** واکشی TMDB وقتی visible شد — پیش‌فرض true */
  enrichWhenVisible?: boolean;
};

export default function LazyItemCoverImage({
  rootMargin = '180px',
  enrichWhenVisible = true,
  title,
  categorySlug,
  fallbackIcon,
  className = '',
  fallbackClassName = '',
  enrichPoster,
  imageUrl,
  coverLayout = 'default',
  ...rest
}: LazyItemCoverImageProps) {
  const { ref, inView } = useLazyInView({ rootMargin, once: true });

  const shouldEnrich = enrichWhenVisible && (enrichPoster ?? true);

  return (
    <div ref={ref as RefObject<HTMLDivElement>} className="h-full w-full">
      {inView ? (
        <ItemCoverImage
          title={title}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon}
          className={className}
          fallbackClassName={fallbackClassName}
          imageUrl={imageUrl}
          enrichPoster={shouldEnrich}
          coverLayout={coverLayout}
          {...rest}
        />
      ) : (
        <ItemCoverPlaceholder
          title={title}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon}
          state="idle"
          layout={coverLayout}
          className={`h-full w-full ${className} ${fallbackClassName}`}
        />
      )}
    </div>
  );
}
