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
      <div className="flex aspect-[5/4] h-full max-h-44 flex-col items-center justify-center rounded-surface border border-dashed border-brand/30 bg-brand/5 p-3 text-center transition-colors hover:border-brand/40 hover:bg-brand/10 sm:aspect-[4/3] lg:aspect-auto lg:min-h-36 lg:max-h-44 lg:flex-row lg:justify-center lg:gap-2 lg:px-4 lg:py-3">
        <span className="mb-1.5 flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand lg:mb-0">
          <LayoutGrid className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-semibold text-brand">{label}</span>
        <span className="mt-0.5 text-xs text-muted-foreground lg:hidden">{description}</span>
        <ChevronLeft className="mt-1.5 size-4 text-brand lg:mt-0" aria-hidden />
      </div>
    </Link>
  );
}
