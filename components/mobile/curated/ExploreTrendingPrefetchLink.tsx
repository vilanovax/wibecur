'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ComponentProps, type ReactNode } from 'react';

type ExploreTrendingPrefetchLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  children: ReactNode;
};

export default function ExploreTrendingPrefetchLink({
  href,
  children,
  ...rest
}: ExploreTrendingPrefetchLinkProps) {
  const router = useRouter();

  const prefetch = () => {
    router.prefetch(href);
  };

  return (
    <Link href={href} onPointerEnter={prefetch} onFocus={prefetch} {...rest}>
      {children}
    </Link>
  );
}
