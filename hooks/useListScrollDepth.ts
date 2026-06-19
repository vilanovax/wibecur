'use client';

import { useEffect, useRef } from 'react';
import { trackListScrollDepth, type ListScrollDepth } from '@/lib/analytics';

const DEPTH_MILESTONES: ListScrollDepth[] = [25, 50, 75, 100];

function getScrollPercent(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  if (scrollHeight <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
}

/** ثبت عمق اسکرول صفحه لیست — هر milestone فقط یک‌بار در هر بازدید */
export function useListScrollDepth(listSlug: string, categorySlug?: string | null) {
  const tracked = useRef(new Set<ListScrollDepth>());

  useEffect(() => {
    tracked.current.clear();

    const checkDepth = () => {
      const percent = getScrollPercent();
      for (const milestone of DEPTH_MILESTONES) {
        if (percent >= milestone && !tracked.current.has(milestone)) {
          tracked.current.add(milestone);
          trackListScrollDepth({
            list_slug: listSlug,
            category_slug: categorySlug ?? undefined,
            depth: milestone,
          });
        }
      }
    };

    checkDepth();
    window.addEventListener('scroll', checkDepth, { passive: true });
    window.addEventListener('resize', checkDepth, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkDepth);
      window.removeEventListener('resize', checkDepth);
    };
  }, [listSlug, categorySlug]);
}
