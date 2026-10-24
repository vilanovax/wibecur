'use client';

import { useEffect, useRef } from 'react';
import { trackListScrollDepth } from '@/lib/analytics';

/** یک رویداد وقتی کاربر واقعاً نیمی از صفحهٔ لیست را رد کرده باشد. */
export function useListScrollDepth(listSlug: string, categorySlug?: string | null) {
  const sent = useRef(false);

  useEffect(() => {
    sent.current = false;

    const onScroll = () => {
      if (sent.current) return;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      if (scrollTop <= 0 || scrollHeight <= 0) return;
      if ((scrollTop / scrollHeight) * 100 < 50) return;
      sent.current = true;
      trackListScrollDepth({
        list_slug: listSlug,
        category_slug: categorySlug ?? undefined,
        depth: 50,
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [listSlug, categorySlug]);
}
