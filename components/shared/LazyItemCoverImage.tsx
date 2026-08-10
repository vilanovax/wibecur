'use client';

import { useEffect, useState } from 'react';
import ItemCoverImage, { type ItemCoverImageProps } from '@/components/shared/ItemCoverImage';
import ItemCoverPlaceholder from '@/components/shared/ItemCoverPlaceholder';
import { useLazyInView } from '@/hooks/useLazyInView';

type LazyItemCoverImageProps = ItemCoverImageProps & {
  rootMargin?: string;
  /** واکشی TMDB وقتی visible شد — پیش‌فرض true */
  enrichWhenVisible?: boolean;
};

/**
 * Lazy cover that still paints above-the-fold images when
 * `content-visibility: auto` parents make IntersectionObserver flaky.
 */
export default function LazyItemCoverImage({
  rootMargin = '280px',
  enrichWhenVisible = true,
  title,
  categorySlug,
  fallbackIcon,
  className = '',
  fallbackClassName = '',
  enrichPoster,
  imageUrl,
  coverLayout = 'default',
  priority = false,
  ...rest
}: LazyItemCoverImageProps) {
  const { ref, inView, elementRef } = useLazyInView<HTMLDivElement>({
    rootMargin,
    once: true,
  });
  const [geometryVisible, setGeometryVisible] = useState(priority);

  useEffect(() => {
    if (priority || inView) {
      setGeometryVisible(true);
      return;
    }

    const el = elementRef.current;
    if (!el || typeof window === 'undefined') return;

    const check = () => {
      const rect = el.getBoundingClientRect();
      const margin = 280;
      const vh = window.innerHeight || 0;
      if (rect.top < vh + margin && rect.bottom > -margin) {
        setGeometryVisible(true);
      }
    };

    // content-visibility parents can delay IO callbacks; geometry is the backup.
    const raf = window.requestAnimationFrame(check);
    const timer = window.setTimeout(check, 160);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [priority, inView, elementRef]);

  const shouldEnrich = enrichWhenVisible && (enrichPoster ?? true);
  const showImage = priority || inView || geometryVisible;

  return (
    <div ref={ref} className="h-full w-full">
      {showImage ? (
        <ItemCoverImage
          title={title}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon}
          className={className}
          fallbackClassName={fallbackClassName}
          imageUrl={imageUrl}
          enrichPoster={shouldEnrich}
          coverLayout={coverLayout}
          priority={priority}
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
