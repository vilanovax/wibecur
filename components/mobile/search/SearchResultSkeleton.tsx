'use client';

type Props = {
  rows?: number;
  className?: string;
};

export default function SearchResultSkeleton({ rows = 4, className = '' }: Props) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-wibe p-2.5">
          <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-lg bg-wibe-surface" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-wibe-surface" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-wibe-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}
