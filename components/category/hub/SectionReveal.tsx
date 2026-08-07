'use client';

import { type ReactNode } from 'react';
import { useLazyInView } from '@/hooks/useLazyInView';

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  /** Mount children only when near viewport (for lazy sections). */
  defer?: boolean;
};

/** Lightweight scroll reveal — no framer-motion. */
export default function SectionReveal({
  children,
  className = '',
  defer = false,
}: SectionRevealProps) {
  const { ref, inView } = useLazyInView<HTMLDivElement>({ rootMargin: '240px', once: true });

  if (defer && !inView) {
    return <div ref={ref} className={`min-h-[6rem] ${className}`} aria-hidden />;
  }

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-300 ease-out motion-reduce:transition-none ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
