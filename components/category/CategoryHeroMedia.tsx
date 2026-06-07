'use client';

import ImageWithFallback from '@/components/shared/ImageWithFallback';

interface CategoryHeroMediaProps {
  src: string;
  alt: string;
  priority?: boolean;
}

/**
 * کاور دسته — بدون برش محتوای مهم:
 * لایه blur برای پر کردن فضا + تصویر اصلی object-contain (۱۶:۹)
 */
export default function CategoryHeroMedia({
  src,
  alt,
  priority = false,
}: CategoryHeroMediaProps) {
  return (
    <>
      <ImageWithFallback
        src={src}
        alt=""
        aria-hidden
        priority={priority}
        placeholderSize="cover"
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-55 saturate-125"
      />
      <ImageWithFallback
        src={src}
        alt={alt}
        priority={priority}
        placeholderSize="cover"
        className="absolute inset-0 h-full w-full object-contain object-center"
      />
    </>
  );
}
