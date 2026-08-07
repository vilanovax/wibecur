'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const CommentSection = dynamic(
  () => import('@/components/mobile/comments/CommentSection'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[8rem] animate-pulse rounded-xl bg-wibe-surface/80" aria-hidden />
    ),
  }
);

const ItemDiscoverySection = dynamic(
  () => import('@/components/mobile/items/ItemDiscoverySection'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[6rem] animate-pulse rounded-xl bg-wibe-surface/80" aria-hidden />
    ),
  }
);

export function CommentSectionLazy(
  props: ComponentProps<typeof CommentSection>
) {
  return <CommentSection {...props} />;
}

export function ItemDiscoverySectionLazy(
  props: ComponentProps<typeof ItemDiscoverySection>
) {
  return <ItemDiscoverySection {...props} />;
}
