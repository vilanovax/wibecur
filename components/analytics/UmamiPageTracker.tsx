'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackUmamiPageView } from '@/lib/umami';

/** ثبت pageview در تغییر مسیر App Router — بار اول را اسکریپت Umami می‌گیرد */
export default function UmamiPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    trackUmamiPageView(url);
  }, [pathname, searchParams]);

  return null;
}
