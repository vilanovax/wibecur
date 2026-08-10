'use client';

import dynamic from 'next/dynamic';
import SearchResultSkeleton from '@/components/mobile/search/SearchResultSkeleton';
import {
  ExploreForYouSectionSkeleton,
  ExploreSurpriseSectionSkeleton,
  ExploreTrendingSectionSkeleton,
} from './explore-section-skeletons';

export const CreateListFormLazy = dynamic(
  () => import('@/components/mobile/user-lists/CreateListForm'),
  { ssr: false }
);

export const GuidedDiscoverySheetLazy = dynamic(() => import('./GuidedDiscoverySheet'), {
  ssr: false,
});

export const SearchResultsPanelLazy = dynamic(
  () => import('@/components/mobile/search/SearchResultsPanel'),
  { loading: () => <SearchResultSkeleton rows={5} /> }
);

export const RandomSurpriseCardLazy = dynamic(() => import('./RandomSurpriseCard'), {
  loading: () => <ExploreSurpriseSectionSkeleton />,
});

export const TrendingNowSectionLazy = dynamic(() => import('./TrendingNowSection'), {
  loading: () => <ExploreTrendingSectionSkeleton />,
});

export const ForYouSectionLazy = dynamic(() => import('./ForYouSection'), {
  loading: () => <ExploreForYouSectionSkeleton />,
});
