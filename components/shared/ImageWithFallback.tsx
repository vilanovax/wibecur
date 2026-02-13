'use client';

import { useState } from 'react';
import { PLACEHOLDER_COVER } from '@/lib/placeholder-images';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
}

/** مسیرهای تصویر خالی/placeholder که باید با تصویر داخلی جایگزین شوند */
const PLACEHOLDER_PATHS = ['/images/placeholder-cover.svg', '/images/placeholder-item.svg'];

function isEmptyOrPlaceholderPath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  const t = url.trim();
  return !t || PLACEHOLDER_PATHS.some((p) => t === p);
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  // اتوماتیک: آدرس خالی یا مسیر placeholder → تصویر داخلی (بنر و هر جای دیگر همیشه تصویر داشته باشد)
  const effectiveSrc =
    isEmptyOrPlaceholderPath(src) ? PLACEHOLDER_COVER : src;

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

  const handleError = () => {
    setHasError(true);
  };

  // وقتی تصویر لود نشد (خطا یا خالی): همیشه تصویر placeholder نشان بده تا کارت خالی نماند
  if (hasError || !effectiveSrc) {
    return (
      <img
        src={PLACEHOLDER_COVER}
        alt={alt}
        className={className}
        loading="lazy"
      />
    );
  }

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
