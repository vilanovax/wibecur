'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { toAdminStorageImageSrc } from '@/lib/liara-image-url';
import ItemCoverPlaceholder from '@/components/shared/ItemCoverPlaceholder';

type AdminItemCardImageProps = {
  itemId: string;
  displaySrc: string;
  title: string;
  categorySlug?: string | null;
  fallbackIcon?: string;
  className?: string;
};

/**
 * Thumbnail کارت آیتم در ادمین — همان رندر ImageUpload (next/image + unoptimized)
 */
export default function AdminItemCardImage({
  itemId,
  displaySrc,
  title,
  categorySlug,
  fallbackIcon = '📋',
  className = '',
}: AdminItemCardImageProps) {
  const [src, setSrc] = useState(() =>
    displaySrc ? toAdminStorageImageSrc(displaySrc) : ''
  );
  const [failed, setFailed] = useState(!displaySrc);
  const [posterFetched, setPosterFetched] = useState(false);
  const [proxyTried, setProxyTried] = useState(false);

  useEffect(() => {
    setSrc(displaySrc ? toAdminStorageImageSrc(displaySrc) : '');
    setFailed(!displaySrc);
    setPosterFetched(false);
    setProxyTried(false);
  }, [displaySrc, itemId]);

  const handleError = useCallback(async () => {
    if (isOurStorageUrl(displaySrc) && !proxyTried && src !== displaySrc) {
      setProxyTried(true);
      setSrc(displaySrc);
      return;
    }

    if (isOurStorageUrl(displaySrc) && !proxyTried) {
      const proxy = toAdminStorageImageSrc(displaySrc);
      if (proxy && proxy !== src) {
        setProxyTried(true);
        setSrc(proxy);
        return;
      }
    }

    if (!posterFetched && itemId) {
      try {
        const res = await fetch(`/api/items/${itemId}/poster`, { cache: 'no-store' });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { posterUrl?: string | null };
        };
        const posterUrl = json?.data?.posterUrl?.trim();
        if (json?.success && posterUrl && posterUrl !== src) {
          setPosterFetched(true);
          setSrc(posterUrl);
          return;
        }
      } catch {
        // ignore
      }
    }

    setFailed(true);
  }, [displaySrc, itemId, posterFetched, proxyTried, src]);

  if (failed || !src) {
    return (
      <ItemCoverPlaceholder
        title={title}
        categorySlug={categorySlug}
        fallbackIcon={fallbackIcon}
        state="empty"
        layout="grid"
        className={className}
        ariaLabel={title}
      />
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={title}
        fill
        unoptimized
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 280px"
        referrerPolicy="no-referrer"
        onError={() => void handleError()}
      />
    </div>
  );
}
