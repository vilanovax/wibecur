'use client';

import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackIcon = '📋',
  fallbackClassName = '',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Skip loading when URL is placeholder or when external images are disabled (e.g. Unsplash blocked)
  const isPlaceholderUrl = src?.includes('via.placeholder.com');
  const isUnsplash = src?.includes('images.unsplash.com');
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

  if (hasError || !src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className} ${fallbackClassName}`}>
        <span className="text-6xl opacity-50">{fallbackIcon}</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
