'use client';

import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react';

type UseLazyInViewOptions = {
  rootMargin?: string;
  threshold?: number;
  /** یک‌بار visible شد، دیگر observer قطع می‌شود */
  once?: boolean;
};

/**
 * IntersectionObserver via callback ref so the first paint never misses observe
 * when `ref.current` was still null in a layout effect.
 */
export function useLazyInView<T extends Element = HTMLElement>(
  options: UseLazyInViewOptions = {}
): { ref: RefCallback<T>; inView: boolean } {
  const { rootMargin = '160px', threshold = 0.01, once = true } = options;
  const [inView, setInView] = useState(false);
  const inViewRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<T | null>(null);

  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  const ref = useCallback<RefCallback<T>>(
    (node) => {
      nodeRef.current = node;
      disconnect();

      if (!node || (once && inViewRef.current)) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            inViewRef.current = true;
            setInView(true);
            if (once) disconnect();
          } else if (!once) {
            inViewRef.current = false;
            setInView(false);
          }
        },
        { rootMargin, threshold }
      );

      observerRef.current = observer;
      observer.observe(node);
    },
    [disconnect, once, rootMargin, threshold]
  );

  useEffect(() => () => disconnect(), [disconnect]);

  return { ref, inView };
}
