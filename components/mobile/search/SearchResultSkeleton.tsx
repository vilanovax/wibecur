'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  rows?: number;
  className?: string;
};

export default function SearchResultSkeleton({ rows = 4, className = '' }: Props) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i} className="flex gap-3 bg-popover p-2.5">
          <Skeleton className="size-16 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}
