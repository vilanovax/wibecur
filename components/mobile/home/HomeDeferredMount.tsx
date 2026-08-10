'use client';

import { type ReactNode } from 'react';
import { useLazyInView } from '@/hooks/useLazyInView';

type HomeDeferredMountProps = {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  /** Override reserved height so secondary lanes don't peek into the first viewport */
  className?: string;
};

/** Mount children (and their dynamic import) only when near the viewport. */
export default function HomeDeferredMount({
  children,
  fallback,
  rootMargin = '320px',
  className = 'min-h-[12rem] lg:min-h-[14rem]',
}: HomeDeferredMountProps) {
  const { ref, inView } = useLazyInView<HTMLDivElement>({ rootMargin, once: true });

  return (
    <div ref={ref} className={className}>
      {inView ? children : fallback}
    </div>
  );
}
