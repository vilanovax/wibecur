'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { resolveListBannerImage } from '@/lib/list-display-images';

export interface ListCoverImageProps {
  coverImage?: string | null;
  /** بنر افقی — اگر bannerImage نباشد برای variant=banner استفاده می‌شود */
  horizontalImage?: string | null;
  /** URL از پیش resolve‌شده برای نمایش افقی */
  bannerImage?: string | null;
  title: string;
  slug?: string | null;
  categorySlug?: string | null;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
  priority?: boolean;
  /** card = کاور عمودی | banner = بنر افقی */
  variant?: 'card' | 'banner';
  /** opt-in بهینه‌سازی next/image (والد باید relative+sized باشد). */
  sizes?: string;
}

/** کاور لیست — card عمودی یا banner افقی */
export default function ListCoverImage({
  coverImage,
  horizontalImage,
  bannerImage,
  title,
  slug,
  categorySlug,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
  priority = false,
  variant = 'card',
  sizes,
}: ListCoverImageProps) {
  const src =
    variant === 'banner'
      ? bannerImage ??
        resolveListBannerImage({
          coverImage,
          horizontalImage,
          slug: slug ?? '',
          title,
          categorySlug,
        })
      : (coverImage ?? '');

  return (
    <ImageWithFallback
      src={src}
      alt={title}
      className={className}
      fallbackIcon={fallbackIcon}
      fallbackClassName={fallbackClassName}
      categorySlug={categorySlug}
      listSlug={slug ?? undefined}
      listTitle={title}
      priority={priority}
      sizes={sizes}
    />
  );
}
