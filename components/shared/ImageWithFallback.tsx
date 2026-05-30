'use client';

import { useState } from 'react';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toLiaraImageSrc } from '@/lib/liara-image-url';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
  placeholderSize?: 'cover' | 'square';
  priority?: boolean;
}

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
  priority = false,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  let displaySrc = '';
  if (!isEmptyOrPlaceholderPath(src)) {
    if (src.startsWith('/')) {
      displaySrc = src;
    } else if (isOurStorageUrl(src)) {
      displaySrc = toLiaraImageSrc(src);
    }
  }

  if (hasError || !displaySrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className} ${fallbackClassName}`}
      >
        <span className="text-6xl opacity-50">{fallbackIcon}</span>
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      referrerPolicy="no-referrer"
    />
  );
}
