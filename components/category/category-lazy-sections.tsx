'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
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
  loading: () => <Skeleton className="h-12 w-full rounded-xl" />,
});
