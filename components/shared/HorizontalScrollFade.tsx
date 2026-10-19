'use client';

import { type CSSProperties, type ReactNode } from 'react';

type FadeSurface = 'surface' | 'card' | 'background';

const fadeColor: Record<FadeSurface, string> = {
  surface: 'var(--wibe-surface)',
  card: 'var(--wibe-card)',
  background: 'var(--background)',
};

type HorizontalScrollFadeProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  fadeStart?: boolean;
  fadeEnd?: boolean;
  /** پنهان‌سازی fade در breakpointهای بزرگ‌تر (مثلاً lg:hidden) */
  fadeClassName?: string;
  /** پهنای محو لبهٔ ادامه. پیش‌فرض نوار پهن برای چیپ. */
  endClassName?: string;
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
  endClassName = 'w-16',
  surface = 'surface',
  dir,
}: HorizontalScrollFadeProps) {
  const edge = { '--wibe-edge-fade': fadeColor[surface] } as CSSProperties;

  return (
    <div className={`relative min-w-0 ${className}`}>
      <div dir={dir} className={`overflow-x-auto scrollbar-hide ${innerClassName}`}>
        {children}
      </div>
      {fadeEnd ? (
        <div
          className={`wibe-edge-fade-end pointer-events-none absolute inset-y-0 end-0 z-[1] ${endClassName} ${fadeClassName}`}
          style={edge}
          aria-hidden
        />
      ) : null}
      {fadeStart ? (
        <div
          className={`wibe-edge-fade-start pointer-events-none absolute inset-y-0 start-0 z-[1] w-10 ${fadeClassName}`}
          style={edge}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
