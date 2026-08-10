'use client';

import dynamic from 'next/dynamic';
import { CategorySectionSkeleton } from '@/components/category/category-section-skeletons';

export type { ItemPreviewData } from './ItemPreviewSheet';

export const ItemPreviewSheetLazy = dynamic(() => import('./ItemPreviewSheet'), {
  ssr: false,
  loading: () => null,
});

/** Warm the preview sheet chunk before first open (pointerdown / hover). */
export function preloadItemPreviewSheet() {
  void import('./ItemPreviewSheet');
}

export const ListItemsMapViewLazy = dynamic(() => import('./ListItemsMapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded-xl border border-wibe bg-wibe-card">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export const ListReportModalLazy = dynamic(() => import('./ListReportModal'), {
  ssr: false,
  loading: () => null,
});

export const SuggestItemSearchLazy = dynamic(() => import('./SuggestItemSearch'), {
  ssr: false,
  loading: () => <CategorySectionSkeleton />,
});

export const ListSimilarListsSectionLazy = dynamic(() => import('./ListSimilarListsSection'), {
  ssr: false,
  loading: () => (
    <section className="mt-1 border-t border-wibe pt-4" aria-hidden>
      <div className="mb-3 h-6 w-36 animate-pulse rounded bg-wibe-surface" />
      <div className="h-28 animate-pulse rounded-lg bg-wibe-surface" />
    </section>
  ),
});

export const ListDetailSidebarLazy = dynamic(() => import('./ListDetailSidebar'), {
  ssr: false,
  loading: () => (
    <aside className="hidden lg:block">
      <div className="h-64 animate-pulse rounded-xl bg-wibe-surface" />
    </aside>
  ),
});
