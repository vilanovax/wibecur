'use client';

import dynamic from 'next/dynamic';
import { CategorySectionSkeleton } from '@/components/category/category-section-skeletons';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

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
    <Card className="flex h-48 items-center justify-center bg-popover">
      <Spinner />
    </Card>
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
      <Skeleton className="mb-3 h-6 w-36" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </section>
  ),
});

export const ListDetailSidebarLazy = dynamic(() => import('./ListDetailSidebar'), {
  ssr: false,
  loading: () => (
    <aside className="hidden lg:block">
      <Skeleton className="h-64 w-full rounded-xl" />
    </aside>
  ),
});
