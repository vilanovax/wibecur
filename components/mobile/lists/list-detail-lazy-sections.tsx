'use client';

import dynamic from 'next/dynamic';

export type { ItemPreviewData } from './ItemPreviewSheet';

export const ItemPreviewSheetLazy = dynamic(() => import('./ItemPreviewSheet'), {
  ssr: false,
  loading: () => null,
});
