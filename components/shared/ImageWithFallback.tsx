'use client';

import { useState } from 'react';
import { PLACEHOLDER_COVER, getRandomPlaceholderUrl } from '@/lib/placeholder-images';
import { getDisplayImageUrl } from '@/lib/display-image';
import type { ImageFolder } from '@/lib/object-storage';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
  /** نسبت placeholder وقتی تصویر خطا داد: cover (۱۶:۸) یا square (۱:۱) */
  placeholderSize?: 'cover' | 'square';
  /** برای تصاویر بالای صفحه (Hero و Featured): اولویت لود بالا */
  priority?: boolean;
  /** پوشهٔ Liara برای resolve کردن URLهای خارجی (پیش‌فرض: covers برای لیست/هدر، items برای آیتم) */
  imageFolder?: ImageFolder;
}

/** مسیرهای تصویر خالی/placeholder که باید با تصویر داخلی جایگزین شوند */
const PLACEHOLDER_PATHS = ['/images/placeholder-cover.svg', '/images/placeholder-item.svg'];

function isEmptyOrPlaceholderPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  const t = url.trim();
  return !t || PLACEHOLDER_PATHS.some((p) => t === p);
}

/** آیا URL از Liara Object Storage خودمان است؟ (برای امتحان پراکسی بعد از خطا) */
function isLiaraStorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('storage.') && host.includes('liara');
  } catch {
    return false;
  }
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
  placeholderSize = 'cover',
  priority = false,
  imageFolder = 'covers',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [randomPlaceholderFailed, setRandomPlaceholderFailed] = useState(false);

  // اتوماتیک: آدرس خالی یا مسیر placeholder → تصویر رندوم (با seed ثابت برای هر کارت)
  const fallbackImageUrl = getRandomPlaceholderUrl(alt + (src || ''), placeholderSize);
  const effectiveSrc =
    isEmptyOrPlaceholderPath(src) ? fallbackImageUrl : src;

  // همهٔ تصاویر از Liara: آدرس نسبی → همان origin؛ Liara → پراکسی (فقط prod)؛ خارجی → API resolve
  const isDevEnv = process.env.NODE_ENV === 'development';
  const displaySrc =
    isEmptyOrPlaceholderPath(src)
      ? effectiveSrc
      : effectiveSrc.startsWith('/')
        ? effectiveSrc
        : isLiaraStorageUrl(effectiveSrc)
          ? isDevEnv
            ? fallbackImageUrl // لوکال: Liara در دسترس نیست، fallback نشون بده
            : `/api/image-proxy?url=${encodeURIComponent(effectiveSrc)}`
          : getDisplayImageUrl(effectiveSrc, imageFolder);

  // Skip loading when URL is placeholder or when external images are disabled (e.g. Unsplash blocked)
  const isPlaceholderUrl = effectiveSrc?.includes('via.placeholder.com');
  const isUnsplash = effectiveSrc?.includes('images.unsplash.com');
  const skipExternalImages =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SKIP_EXTERNAL_IMAGES === 'true';
  if (isPlaceholderUrl || (isUnsplash && skipExternalImages)) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className} ${fallbackClassName}`}>
        <span className="text-6xl opacity-50">{fallbackIcon}</span>
      </div>
    );
  }

  const handleError = () => setHasError(true);
  const handleFallbackImageError = () => setRandomPlaceholderFailed(true);

  // وقتی تصویر لود نشد (خطا یا خالی): اول تصویر رندوم، اگر آن هم خطا داد خاکستری
  if (hasError || !effectiveSrc) {
    const showGray = randomPlaceholderFailed;
    const fallbackSrc = showGray ? PLACEHOLDER_COVER : getRandomPlaceholderUrl(alt + (src || ''), placeholderSize);
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        onError={showGray ? undefined : handleFallbackImageError}
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
    />
  );
}
