'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackFeaturedHeroClick } from '@/components/mobile/home/HomeHeroClientActions';

type HomeHeroBannerLinkProps = {
  href: string;
  listId: string;
  slotId: string | null;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
};

export default function HomeHeroBannerLink({
  href,
  listId,
  slotId,
  className,
  ariaLabel,
  children,
}: HomeHeroBannerLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={() => trackFeaturedHeroClick(slotId, listId)}
    >
      {children}
    </Link>
  );
}
