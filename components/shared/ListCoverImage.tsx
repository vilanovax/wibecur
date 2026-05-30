'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';

export interface ListCoverImageProps {
  coverImage?: string | null;
  title: string;
  slug?: string | null;
  categorySlug?: string | null;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
  priority?: boolean;
}

/** کاور لیست/بنر — تصویر متناسب با دسته و موضوع */
export default function ListCoverImage({
  coverImage,
  title,
  slug,
  categorySlug,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
  priority = false,
}: ListCoverImageProps) {
  return (
    <ImageWithFallback
      src={coverImage ?? ''}
      alt={title}
      className={className}
      fallbackIcon={fallbackIcon}
      fallbackClassName={fallbackClassName}
      categorySlug={categorySlug}
      listSlug={slug ?? undefined}
      listTitle={title}
      priority={priority}
    />
  );
}
