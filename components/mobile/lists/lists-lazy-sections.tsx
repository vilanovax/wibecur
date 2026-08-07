'use client';

import dynamic from 'next/dynamic';

const FilterBottomSheetPro = dynamic(
  () => import('@/components/mobile/lists/FilterBottomSheetPro'),
  { ssr: false }
);

export default FilterBottomSheetPro;

export type {
  FilterState,
  VibeFilter,
} from '@/components/mobile/lists/FilterBottomSheetPro';

export const SearchResultsPanelLazy = dynamic(
  () => import('@/components/mobile/search/SearchResultsPanel'),
  { loading: () => null }
);

export const ListsCategorySectionLazy = dynamic(
  () => import('@/components/mobile/lists/ListsCategorySection'),
  {
    loading: () => (
      <section className="mb-6" aria-hidden>
        <div className="mb-3 h-6 w-36 animate-pulse rounded bg-wibe-surface" />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[5/4] animate-pulse rounded-xl bg-wibe-surface" />
          ))}
        </div>
      </section>
    ),
  }
);
