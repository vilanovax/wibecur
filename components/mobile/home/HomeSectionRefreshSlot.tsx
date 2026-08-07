'use client';

import { type ReactNode } from 'react';
import { useHomeData } from '@/contexts/HomeDataContext';

type HomeSectionRefreshSlotProps = {
  children: ReactNode;
  fallback: ReactNode;
};

/** Keep SSR section until pull-to-refresh; then swap to interactive client section. */
export default function HomeSectionRefreshSlot({
  children,
  fallback,
}: HomeSectionRefreshSlotProps) {
  const { isRefetching } = useHomeData();
  if (isRefetching) return fallback;
  return <>{children}</>;
}
