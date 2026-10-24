'use client';

import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Script from 'next/script';
import {
  getUmamiHostUrl,
  getUmamiScriptUrl,
  getUmamiWebsiteId,
  shouldTrackUmamiHost,
  shouldTrackUmamiPath,
} from '@/lib/umami';
import UmamiPageTracker from './UmamiPageTracker';

/** اسکریپت Umami + ردیابی pageview در ناوبری کلاینت */
export default function UmamiAnalytics() {
  const websiteId = getUmamiWebsiteId();
  const pathname = usePathname();
  const [track, setTrack] = useState(false);

  useEffect(() => {
    if (!websiteId) return;
    setTrack(
      shouldTrackUmamiPath(pathname) &&
        shouldTrackUmamiHost(window.location.hostname, process.env.NEXT_PUBLIC_UMAMI_DOMAINS)
    );
  }, [websiteId, pathname]);

  if (!websiteId || !track) return null;

  const domains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS?.trim();
  const hostUrl = getUmamiHostUrl();

  return (
    <>
      <Script
        defer
        src={getUmamiScriptUrl()}
        data-website-id={websiteId}
        data-auto-track="false"
        {...(hostUrl ? { 'data-host-url': hostUrl } : {})}
        {...(domains ? { 'data-domains': domains } : {})}
        strategy="lazyOnload"
      />
      <Suspense fallback={null}>
        <UmamiPageTracker />
      </Suspense>
    </>
  );
}
