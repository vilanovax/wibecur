'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const VibeCommentSection = dynamic(() => import('./VibeCommentSection'), {
  ssr: false,
  loading: () => (
    <section className="px-4 py-6" aria-label="در حال بارگذاری نظرات">
      <div className="mb-4 h-6 w-28 animate-pulse rounded bg-wibe-surface" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-wibe-surface" />
        ))}
      </div>
    </section>
  ),
});

type VibeCommentSectionLazyProps = ComponentProps<typeof VibeCommentSection>;

export default function VibeCommentSectionLazy(props: VibeCommentSectionLazyProps) {
  return <VibeCommentSection {...props} />;
}
