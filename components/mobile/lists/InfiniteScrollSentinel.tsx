'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollSentinelProps {
  hasMore: boolean;
  onLoadMore: () => void;
  /** فقط وقتی واقعاً در حال لود است اسپینر نشان بده — نه همیشه وقتی hasMore */
  loading?: boolean;
}

export default function InfiniteScrollSentinel({
  hasMore,
  onLoadMore,
  loading = false,
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!loading) loadingRef.current = false;
  }, [hasMore, loading]);

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loadingRef.current) return;
        loadingRef.current = true;
        onLoadMore();
      },
      { rootMargin: '280px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div
      ref={ref}
      className={loading ? 'flex justify-center py-5' : 'h-px w-full'}
      aria-hidden={!loading}
      aria-busy={loading || undefined}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : null}
    </div>
  );
}
