'use client';

import dynamic from 'next/dynamic';
import { CategorySectionSkeleton, CategoryTrendingSectionSkeleton } from './category-section-skeletons';

export const TrendingListsSectionLazy = dynamic(() => import('./TrendingListsSection'), {
  loading: () => <CategoryTrendingSectionSkeleton />,
});

export const ViralSpotlightSectionLazy = dynamic(() => import('./ViralSpotlightSection'), {
  loading: () => <CategorySectionSkeleton />,
});

export const NewListsSectionLazy = dynamic(() => import('./NewListsSection'), {
  loading: () => <CategorySectionSkeleton />,
});

export const ExploreByCityPillsLazy = dynamic(() => import('./hub/ExploreByCityPills'), {
  loading: () => <CategorySectionSkeleton />,
});

export const MostSavedItemsCafeLazy = dynamic(() => import('./hub/MostSavedItemsCafe'), {
  loading: () => <CategorySectionSkeleton />,
});

export const LatestItemsSectionLazy = dynamic(() => import('./hub/LatestItemsSection'), {
  loading: () => <CategorySectionSkeleton />,
});

export const CategoryCreateCTALazy = dynamic(() => import('./CategoryCreateCTA'), {
  loading: () => <CategorySectionSkeleton />,
});

export const GenreScrollBarLazy = dynamic(() => import('./film/GenreScrollBar'), {
  loading: () => <div className="h-12 animate-pulse rounded-lg bg-gray-100" aria-hidden />,
});
