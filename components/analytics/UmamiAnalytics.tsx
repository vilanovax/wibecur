import { Suspense } from 'react';
import Script from 'next/script';
import { getUmamiHostUrl, getUmamiScriptUrl, getUmamiWebsiteId } from '@/lib/umami';
import UmamiPageTracker from './UmamiPageTracker';

/** اسکریپت Umami + ردیابی pageview در ناوبری کلاینت */
export default function UmamiAnalytics() {
  const websiteId = getUmamiWebsiteId();
  if (!websiteId) return null;

  const domains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS?.trim();
  const hostUrl = getUmamiHostUrl();

  return (
    <>
      <Script
        defer
        src={getUmamiScriptUrl()}
        data-website-id={websiteId}
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
