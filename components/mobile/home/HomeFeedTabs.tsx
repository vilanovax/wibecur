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
      <div className="mb-2.5 flex items-start justify-between gap-3 px-4 lg:mb-0 lg:border-b lg:border-border lg:px-5 lg:pb-4 lg:pt-4">
        <div className="min-w-0">
          <h2 className="wibe-h3 text-foreground">ترند این هفته</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            لیست‌های محبوب · حال‌وهوا در{' '}
            <Link href="/explore" className="underline-offset-2 hover:underline">
              <span className="font-semibold text-brand">اکسپلور</span>
            </Link>
          </p>
        </div>
        <Link
          href="/lists?mode=trending"
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-1.5"
        >
          <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand">
            کاتالوگ ترند
            <ChevronLeft className="size-4" aria-hidden />
          </span>
        </Link>
      </div>

      <div className="lg:px-5 lg:pb-5 lg:pt-1">{carousel}</div>
    </section>
  );
}
