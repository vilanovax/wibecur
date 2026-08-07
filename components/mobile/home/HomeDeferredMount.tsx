'use client';

import { type ReactNode } from 'react';
import { useLazyInView } from '@/hooks/useLazyInView';

type HomeDeferredMountProps = {
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
};

/** Mount children (and their dynamic import) only when near the viewport. */
export default function HomeDeferredMount({
  children,
  fallback,
  rootMargin = '320px',
}: HomeDeferredMountProps) {
  const { ref, inView } = useLazyInView<HTMLDivElement>({ rootMargin, once: true });

  return (
    <div ref={ref} className="min-h-[1px]">
      {inView ? children : fallback}
    </div>
  );
}
