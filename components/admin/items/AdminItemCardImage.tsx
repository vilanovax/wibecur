'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import { resolveAdminDisplayImageSrc } from '@/lib/resolve-admin-display-image';
import ItemCoverPlaceholder from '@/components/shared/ItemCoverPlaceholder';

type AdminItemCardImageProps = {
  itemId: string;
  displaySrc: string;
  title: string;
  categorySlug?: string | null;
  fallbackIcon?: string;
  className?: string;
  onLoaded?: () => void;
};

export default function AdminItemCardImage({
  itemId,
  displaySrc,
  title,
  categorySlug,
  fallbackIcon = '📋',
  className = '',
  onLoaded,
}: AdminItemCardImageProps) {
  const [src, setSrc] = useState(() =>
    displaySrc ? resolveAdminDisplayImageSrc(displaySrc) : ''
  );
  const [failed, setFailed] = useState(!displaySrc);
  const [loading, setLoading] = useState(Boolean(displaySrc));
  const [posterFetched, setPosterFetched] = useState(false);
  const [proxyTried, setProxyTried] = useState(false);

  useEffect(() => {
    setSrc(displaySrc ? resolveAdminDisplayImageSrc(displaySrc) : '');
    setFailed(!displaySrc);
    setLoading(Boolean(displaySrc));
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
      const proxy = resolveAdminDisplayImageSrc(displaySrc);
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
        if (json?.success && posterUrl) {
          const resolved = resolveAdminDisplayImageSrc(posterUrl);
          if (resolved && resolved !== src) {
            setPosterFetched(true);
            setLoading(true);
            setFailed(false);
            setSrc(resolved);
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    setLoading(false);
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
    <div className={`relative h-full w-full overflow-hidden bg-gray-200 ${className}`}>
      {loading && (
        <ItemCoverPlaceholder
          title={title}
          categorySlug={categorySlug}
          fallbackIcon={fallbackIcon}
          state="loading"
          layout="grid"
          className="absolute inset-0 z-0"
          ariaLabel={title}
        />
      )}
      <Image
        src={src}
        alt={title}
        fill
        unoptimized
        className={`object-cover transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        sizes="(max-width: 768px) 50vw, 280px"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setLoading(false);
          setFailed(false);
          onLoaded?.();
        }}
        onError={() => void handleError()}
      />
    </div>
  );
}
