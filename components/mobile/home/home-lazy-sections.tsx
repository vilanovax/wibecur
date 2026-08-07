'use client';

import dynamic from 'next/dynamic';
import { HomeFeedSectionSkeleton } from './home-section-skeletons';

export const HomeSavedListsSectionLazy = dynamic(
  () => import('./HomeSavedListsSection'),
  { loading: () => <HomeFeedSectionSkeleton /> }
);

export const ForYouSectionLazy = dynamic(() => import('./ForYouSection'), {
  loading: () => <HomeFeedSectionSkeleton titleWidth="w-32" />,
});

export const HomePersonalizedFeedSectionLazy = dynamic(
  () => import('./HomePersonalizedFeedSection'),
  { loading: () => <HomeFeedSectionSkeleton titleWidth="w-24" /> }
);

export const NewAndRisingSectionLazy = dynamic(() => import('./NewAndRisingSection'), {
  loading: () => <HomeFeedSectionSkeleton titleWidth="w-40" />,
});
