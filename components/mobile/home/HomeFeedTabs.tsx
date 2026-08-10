import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type HomeFeedTabsProps = {
  carousel: ReactNode;
};

/**
 * RSC header + injected carousel (SSR trending cards).
 * Single discovery lane on Home: trending catalog.
 */
export default function HomeFeedTabs({ carousel }: HomeFeedTabsProps) {
  return (
    <section className="mb-3 lg:mb-0" aria-label="فید کشف">
      <div className="mb-2.5 flex items-start justify-between gap-3 px-4 lg:mb-0 lg:border-b lg:border-wibe/60 lg:px-5 lg:pb-4 lg:pt-4">
        <div className="min-w-0">
          <h2 className="wibe-h3 text-foreground">ترند این هفته</h2>
          <p className="mt-0.5 wibe-caption text-wibe-secondary">
            لیست‌های محبوب · حال‌وهوا در{' '}
            <Link
              href="/explore"
              className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              اکسپلور
            </Link>
          </p>
        </div>
        <Link
          href="/lists?mode=trending"
          className="inline-flex min-h-10 shrink-0 items-center gap-0.5 rounded-lg px-1.5 wibe-caption font-semibold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:min-h-0 lg:px-0"
        >
          کاتالوگ ترند
          <ChevronLeft className="h-3.5 w-3.5 rotate-180" aria-hidden />
        </Link>
      </div>

      <div className="lg:px-5 lg:pb-5 lg:pt-1">{carousel}</div>
    </section>
  );
}
