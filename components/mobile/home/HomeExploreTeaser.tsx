'use client';

import Link from 'next/link';
import { Compass, ChevronLeft } from 'lucide-react';
import { ACTIVATION } from '@/lib/activation-copy';

/**
 * پل خانه → اکسپلور؛ حال‌وهوا کامل فقط در /explore.
 */
export default function HomeExploreTeaser() {
  const copy = ACTIVATION.exploreTeaser;

  return (
    <section className="mx-4 mb-4 lg:mx-0" aria-label="کشف با حال‌وهوا">
      <Link
        href={copy.href}
        className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-l from-primary/[0.07] via-wibe-card to-amber-50/40 px-4 py-3.5 shadow-vibe-sm transition-[colors,transform,box-shadow] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-vibe-card active:scale-[0.99]"
      >
        <span
          className="pointer-events-none absolute -left-6 top-0 h-20 w-20 rounded-full bg-amber-300/20 blur-2xl"
          aria-hidden
        />
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm ring-1 ring-primary/20">
          <Compass className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block wibe-small font-bold text-foreground">{copy.title}</span>
          <span className="mt-0.5 block wibe-caption text-wibe-secondary">
            {copy.description}
          </span>
        </span>
        <ChevronLeft
          className="relative h-5 w-5 shrink-0 rotate-180 text-primary transition-transform group-hover:translate-x-[-2px]"
          aria-hidden
        />
      </Link>
    </section>
  );
}
