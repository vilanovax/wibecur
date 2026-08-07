'use client';

import Link from 'next/link';
import { Compass, ChevronLeft } from 'lucide-react';
import { ACTIVATION } from '@/lib/activation-copy';

/**
 * پل خانه → اکسپلور؛ حال‌وهوا کامل فقط در /explore.
 * سبک و ثانویه نگه داشته می‌شود تا با تب فید رقابت نکند.
 */
export default function HomeExploreTeaser() {
  const copy = ACTIVATION.exploreTeaser;

  return (
    <section className="mx-4 mb-3 lg:mx-0 lg:mb-4" aria-label="کشف با حال‌وهوا">
      <Link
        href={copy.href}
        className="group flex items-center gap-3 rounded-2xl border border-wibe bg-wibe-surface px-3.5 py-3 transition-colors hover:border-primary/25 hover:bg-primary/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Compass className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-right">
          <span className="block wibe-small font-bold text-foreground">{copy.title}</span>
          <span className="mt-0.5 block wibe-caption text-wibe-secondary">{copy.description}</span>
        </span>
        <ChevronLeft
          className="h-4 w-4 shrink-0 text-wibe-secondary transition-transform group-hover:-translate-x-0.5 group-hover:text-primary"
          aria-hidden
        />
      </Link>
    </section>
  );
}
