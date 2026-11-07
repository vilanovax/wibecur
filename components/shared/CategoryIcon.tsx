'use client';

import Image from 'next/image';
import { getDisplayImageUrl } from '@/lib/display-image';
import { cn } from '@/lib/utils';

type CategoryIconProps = {
  icon?: string | null;
  iconImage?: string | null;
  /** اندازه کانتینر — برای کاشی‌ها و چیپ‌ها */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  /** فقط ایموجی/تصویر بدون کاشی پس‌زمینه */
  bare?: boolean;
};

const boxSize: Record<NonNullable<CategoryIconProps['size']>, string> = {
  xs: 'size-5 text-sm',
  sm: 'size-8 text-base',
  md: 'size-11 text-xl',
  lg: 'size-14 text-2xl',
};

const imgSize: Record<NonNullable<CategoryIconProps['size']>, number> = {
  xs: 20,
  sm: 32,
  md: 44,
  lg: 56,
};

/**
 * نمایش آیکون دسته — تصویر گرافیکی اگر باشد، وگرنه ایموجی.
 */
export default function CategoryIcon({
  icon,
  iconImage,
  size = 'md',
  className,
  bare = false,
}: CategoryIconProps) {
  const imageUrl = getDisplayImageUrl(iconImage) || '';
  const emoji = icon?.trim() || '📋';
  const px = imgSize[size];

  const content = imageUrl ? (
    <Image
      src={imageUrl}
      alt=""
      width={px}
      height={px}
      className="h-full w-full object-contain"
      unoptimized
    />
  ) : (
    <span aria-hidden>{emoji}</span>
  );

  if (bare) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center',
          boxSize[size],
          className
        )}
        aria-hidden
      >
        {content}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted',
        boxSize[size],
        className
      )}
      aria-hidden
    >
      {content}
    </span>
  );
}
