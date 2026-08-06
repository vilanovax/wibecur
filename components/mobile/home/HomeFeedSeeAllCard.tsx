'use client';

import Link from 'next/link';
import { ChevronLeft, LayoutGrid } from 'lucide-react';

type Props = {
  href: string;
  label?: string;
  description?: string;
};

export default function HomeFeedSeeAllCard({
  href,
  label = 'مشاهده همه',
  description = 'لیست‌های بیشتر',
}: Props) {
  return (
    <Link
      href={href}
      className="group block w-[10rem] shrink-0 snap-start lg:w-full lg:shrink lg:h-full"
    >
      <div className="flex aspect-[5/4] h-full max-h-[11.5rem] flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-center transition-colors hover:border-primary/45 hover:bg-primary/10 sm:aspect-[4/3] lg:aspect-auto lg:min-h-[8.5rem] lg:max-h-[11.5rem] lg:flex-row lg:justify-center lg:gap-2 lg:rounded-xl lg:px-4 lg:py-3">
        <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary/25 lg:mb-0 lg:h-7 lg:w-7">
          <LayoutGrid className="h-4 w-4" aria-hidden />
        </span>
        <span className="wibe-small font-semibold text-primary lg:text-[0.8125rem]">{label}</span>
        <span className="mt-0.5 wibe-caption text-wibe-secondary lg:hidden">{description}</span>
        <ChevronLeft
          className="mt-1.5 h-3.5 w-3.5 rotate-180 text-primary opacity-70 transition-transform group-hover:translate-x-[-2px] lg:mt-0 lg:h-3.5 lg:w-3.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}
