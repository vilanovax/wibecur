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
  fallbackIcon,
  fallbackClassName = '',
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const handleError = () => {
    setHasError(true);
    // Try to remove query parameters if it's an Unsplash URL
    if (imageSrc.includes('unsplash.com') && imageSrc.includes('?')) {
      const baseUrl = imageSrc.split('?')[0];
      if (baseUrl !== imageSrc) {
        setImageSrc(baseUrl);
        setHasError(false);
        return;
      }
    }
  };

  if (hasError && fallbackIcon) {
    return (
      <div className={`flex items-center justify-center ${className} ${fallbackClassName}`}>
        <span className="text-6xl">{fallbackIcon}</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
