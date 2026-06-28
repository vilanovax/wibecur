'use client';

import dynamic from 'next/dynamic';
import { CategorySectionSkeleton } from '@/components/category/category-section-skeletons';

export type { ItemPreviewData } from './ItemPreviewSheet';

export const ItemPreviewSheetLazy = dynamic(() => import('./ItemPreviewSheet'), {
  ssr: false,
  loading: () => null,
});

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
