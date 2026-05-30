'use client';

import { useEffect, useRef, useState } from 'react';

type UseLazyInViewOptions = {
  rootMargin?: string;
  threshold?: number;
  /** یک‌بار visible شد، دیگر observer قطع می‌شود */
  once?: boolean;
};

/** IntersectionObserver — برای lazy-load تصویر/poster */
export function useLazyInView(options: UseLazyInViewOptions = {}) {
  const { rootMargin = '160px', threshold = 0.01, once = true } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (once && inView) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, once, rootMargin, threshold]);

  return { ref, inView };
}
