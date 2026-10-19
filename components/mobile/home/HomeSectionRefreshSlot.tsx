'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useHomeData } from '@/contexts/HomeDataContext';

type HomeSectionRefreshSlotProps = {
  children: ReactNode;
  fallback: ReactNode;
};

/**
 * Keep SSR section on first paint. After the first pull-to-refresh cycle starts,
 * swap once to the client section (avoids isRefetching flash every refetch).
 */
export default function HomeSectionRefreshSlot({
  children,
  fallback,
}: HomeSectionRefreshSlotProps) {
  const { isRefetching } = useHomeData();
  const [useClient, setUseClient] = useState(false);

  useEffect(() => {
    if (isRefetching) setUseClient(true);
  }, [isRefetching]);

  if (useClient) return <>{fallback}</>;
  return <>{children}</>;
}
