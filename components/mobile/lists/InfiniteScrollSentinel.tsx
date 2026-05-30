'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollSentinelProps {
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function InfiniteScrollSentinel({
  hasMore,
  onLoadMore,
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    loadingRef.current = false;
  }, [hasMore]);

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
    <div ref={ref} className="py-5 flex justify-center" aria-hidden>
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
    </div>
  );
}
