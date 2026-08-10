'use client';

export function ExplorePageSkeleton() {
  return (
    <div className="bg-wibe-surface">
      {/* Hero */}
      <div className="border-b border-wibe px-2.5 pb-3 pt-2">
        <div className="mb-2 h-6 w-40 animate-pulse rounded bg-wibe-surface" />
        <div className="mb-2.5 h-10 animate-pulse rounded-xl bg-wibe-surface" />
        <div className="flex gap-1.5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-wibe-surface" />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-2.5 py-4">
        <div className="mb-2.5 h-5 w-28 animate-pulse rounded bg-wibe-surface" />
        <div className="mb-1 h-3 w-44 animate-pulse rounded bg-wibe-surface" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] w-[88px] shrink-0 animate-pulse rounded-xl bg-wibe-surface" />
          ))}
        </div>
        <div className="mt-2.5 h-10 animate-pulse rounded-xl bg-wibe-surface" />
      </div>

      {/* Trending carousel */}
      <div className="px-2.5 py-4">
        <div className="mb-2.5 h-5 w-36 animate-pulse rounded bg-wibe-surface" />
        <div className="flex gap-2.5 overflow-hidden">
          <div className="h-[180px] w-[88%] max-w-[280px] shrink-0 animate-pulse rounded-xl bg-wibe-surface" />
          <div className="h-[180px] w-[60%] shrink-0 animate-pulse rounded-xl bg-wibe-surface" />
        </div>
      </div>

      {/* For you rows */}
      <div className="border-t border-wibe/60 px-2.5 py-4">
        <div className="mb-3 h-5 w-32 animate-pulse rounded bg-wibe-surface" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-row-reverse gap-2.5 rounded-xl border border-wibe p-2.5">
              <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-lg bg-wibe-surface" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="h-4 w-4/5 animate-pulse rounded bg-wibe-surface" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-wibe-surface" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rising grid */}
      <div className="border-t border-wibe/60 px-2.5 py-4">
        <div className="mb-3 h-5 w-36 animate-pulse rounded bg-wibe-surface" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-wibe">
              <div className="aspect-[4/3] animate-pulse bg-wibe-surface" />
              <div className="p-2">
                <div className="h-4 w-full animate-pulse rounded bg-wibe-surface" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
