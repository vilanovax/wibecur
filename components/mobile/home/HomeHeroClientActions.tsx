'use client';

import { useEffect } from 'react';

function trackFeaturedImpressionOnce(slotId: string) {
  try {
    const key = `featured_impression_${slotId}`;
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      fetch('/api/home-featured/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

type HomeHeroImpressionTrackerProps = {
  slotId: string | null;
};

/** Tracks featured hero impressions without rendering UI. */
export default function HomeHeroImpressionTracker({ slotId }: HomeHeroImpressionTrackerProps) {
  useEffect(() => {
    if (slotId) trackFeaturedImpressionOnce(slotId);
  }, [slotId]);

  return null;
}
