'use client';

export function HeroSkeleton() {
  return (
    <div className="rounded-[22px] p-5 mx-4 mt-4 bg-wibe-surface animate-pulse">
      <div className="h-5 w-3/4 bg-wibe-surface rounded mb-2" />
      <div className="h-4 w-full bg-wibe-surface rounded mb-4" />
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-wibe-surface rounded-xl" />
        <div className="h-10 w-36 bg-wibe-surface rounded-xl" />
      </div>
    </div>
  );
}

export function CuratorsRowSkeleton() {
  return (
    <div className="px-4 py-4">
      <div className="h-5 w-48 bg-wibe-surface rounded mb-3 animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[140px] rounded-[18px] bg-wibe-surface p-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-wibe-surface mx-auto" />
            <div className="h-4 bg-wibe-surface rounded mt-2 w-full" />
            <div className="h-3 bg-wibe-surface rounded mt-2 w-2/3 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridCardSkeleton() {
  return (
    <div className="rounded-[20px] overflow-hidden bg-wibe-surface animate-pulse">
      <div className="aspect-[4/3] bg-wibe-surface" />
      <div className="p-3">
        <div className="h-3 w-16 bg-wibe-surface rounded mb-2" />
        <div className="h-4 w-full bg-wibe-surface rounded mb-1" />
        <div className="h-3 w-3/4 bg-wibe-surface rounded mb-2" />
        <div className="flex gap-2">
          <div className="h-3 w-8 bg-wibe-surface rounded" />
          <div className="h-3 w-10 bg-wibe-surface rounded" />
          <div className="h-3 w-8 bg-wibe-surface rounded" />
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2">
          <div className="w-6 h-6 rounded-full bg-wibe-surface" />
          <div className="h-3 w-20 bg-wibe-surface rounded" />
        </div>
      </div>
    </div>
  );
}
