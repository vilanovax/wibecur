'use client';

import {
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type TouchEvent,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useHomeData } from '@/contexts/HomeDataContext';

const PULL_THRESHOLD = 72;
const MAX_PULL = 100;

interface HomePullToRefreshProps {
  children: ReactNode;
}

export default function HomePullToRefresh({ children }: HomePullToRefreshProps) {
  const { refetch, isRefetching } = useHomeData();
  const queryClient = useQueryClient();
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['home', 'for-you'] }),
        queryClient.invalidateQueries({ queryKey: ['user', 'interaction-count'] }),
        queryClient.invalidateQueries({ queryKey: ['user'] }),
        queryClient.invalidateQueries({ queryKey: ['spotlight', 'current'] }),
      ]);
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [refetch, queryClient]);

  const onTouchStart = (e: TouchEvent) => {
    if (refreshing || isRefetching) return;
    if (window.scrollY > 4) return;
    startY.current = e.touches[0]?.clientY ?? 0;
    pulling.current = true;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!pulling.current || refreshing || isRefetching) return;
    if (window.scrollY > 4) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const y = e.touches[0]?.clientY ?? 0;
    const delta = Math.max(0, y - startY.current);
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.45, MAX_PULL));
    }
  };

  const onTouchEnd = () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      void handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  const showIndicator = pullDistance > 8 || refreshing || isRefetching;
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: showIndicator ? Math.max(pullDistance, refreshing ? 48 : 0) : 0 }}
        aria-hidden={!showIndicator}
      >
        <div
          className="flex items-center gap-2 text-primary"
          style={{
            opacity: refreshing || isRefetching ? 1 : progress,
            transform: `scale(${0.85 + progress * 0.15})`,
          }}
        >
          <Loader2
            className={`h-5 w-5 ${refreshing || isRefetching ? 'animate-spin' : ''}`}
            style={{
              transform: refreshing || isRefetching ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />
          <span className="wibe-caption font-medium">
            {refreshing || isRefetching ? 'در حال بروزرسانی…' : 'رها کن تا بروز شود'}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
