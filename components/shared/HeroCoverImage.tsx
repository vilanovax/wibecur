'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';

type HeroCoverImageProps = {
  src: string;
  alt: string;
  fallbackIcon?: string;
  categorySlug?: string | null;
  listSlug?: string | null;
  listTitle?: string | null;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/**
 * کاور Hero با fallback — برای بنر خانه و دسته
 */
export default function HeroCoverImage({
  src,
  alt,
  fallbackIcon = '📚',
  categorySlug,
  listSlug,
  listTitle,
  priority = false,
  sizes = '100vw',
  className = 'absolute inset-0 h-full w-full object-cover object-center',
}: HeroCoverImageProps) {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      priority={priority}
      placeholderSize="cover"
      sizes={sizes}
      className={className}
      fallbackIcon={fallbackIcon}
      fallbackClassName="flex h-full w-full min-h-[12rem] items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-5xl lg:text-7xl"
      categorySlug={categorySlug}
      listSlug={listSlug}
      listTitle={listTitle}
    />
  );
}
