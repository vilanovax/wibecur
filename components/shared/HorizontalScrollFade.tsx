'use client';

import { type ReactNode } from 'react';

type FadeSurface = 'surface' | 'card' | 'background';

const fadeFromClass: Record<FadeSurface, string> = {
  surface: 'from-wibe-surface',
  card: 'from-wibe-card',
  background: 'from-wibe-background',
};

type HorizontalScrollFadeProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  fadeStart?: boolean;
  fadeEnd?: boolean;
  /** پنهان‌سازی fade در breakpointهای بزرگ‌تر (مثلاً lg:hidden) */
  fadeClassName?: string;
  surface?: FadeSurface;
  dir?: 'rtl' | 'ltr';
};

/**
 * اسکرول افقی با fade لبه — hint برای محتوای بیشتر (RTL-safe با start/end).
 */
export default function HorizontalScrollFade({
  children,
  className = '',
  innerClassName = '',
  fadeStart = false,
  fadeEnd = true,
  fadeClassName = '',
  surface = 'surface',
  dir,
}: HorizontalScrollFadeProps) {
  const from = fadeFromClass[surface];

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div dir={dir} className={`overflow-x-auto scrollbar-hide ${innerClassName}`}>
        {children}
      </div>
      {fadeEnd ? (
        <div
          className={`pointer-events-none absolute inset-y-0 end-0 z-[1] w-6 bg-gradient-to-l ${from} to-transparent ${fadeClassName}`}
          aria-hidden
        />
      ) : null}
      {fadeStart ? (
        <div
          className={`pointer-events-none absolute inset-y-0 start-0 z-[1] w-4 bg-gradient-to-r ${from} to-transparent opacity-90 ${fadeClassName}`}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
