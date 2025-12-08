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

  // Check if URL is from via.placeholder.com and skip loading it
  const isPlaceholderUrl = src?.includes('via.placeholder.com');
  
  // If it's a placeholder URL, use fallback immediately
  if (isPlaceholderUrl) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className} ${fallbackClassName}`}>
        <span className="text-6xl opacity-50">{fallbackIcon}</span>
      </div>
    );
  }

  const handleError = () => {
    setHasError(true);
    // Try to remove query parameters if it's an Unsplash URL
    if (imageSrc?.includes('unsplash.com') && imageSrc.includes('?')) {
      const baseUrl = imageSrc.split('?')[0];
      if (baseUrl !== imageSrc) {
        setImageSrc(baseUrl);
        setHasError(false);
        return;
      }
    }
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
