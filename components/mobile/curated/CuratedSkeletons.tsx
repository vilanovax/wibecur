'use client';

export function HeroSkeleton() {
  return (
    <div className="rounded-[22px] p-5 mx-4 mt-4 bg-gray-200 animate-pulse">
      <div className="h-5 w-3/4 bg-gray-300 rounded mb-2" />
      <div className="h-4 w-full bg-gray-300 rounded mb-4" />
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-gray-300 rounded-xl" />
        <div className="h-10 w-36 bg-gray-300 rounded-xl" />
      </div>
    </div>
  );
}

export function CuratorsRowSkeleton() {
  return (
    <div className="px-4 py-4">
      <div className="h-5 w-48 bg-gray-200 rounded mb-3 animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[140px] rounded-[18px] bg-gray-200 p-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-300 mx-auto" />
            <div className="h-4 bg-gray-300 rounded mt-2 w-full" />
            <div className="h-3 bg-gray-300 rounded mt-2 w-2/3 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridCardSkeleton() {
  return (
    <div className="rounded-[20px] overflow-hidden bg-gray-200 animate-pulse">
      <div className="aspect-[4/3] bg-gray-300" />
      <div className="p-3">
        <div className="h-3 w-16 bg-gray-300 rounded mb-2" />
        <div className="h-4 w-full bg-gray-300 rounded mb-1" />
        <div className="h-3 w-3/4 bg-gray-300 rounded mb-2" />
        <div className="flex gap-2">
          <div className="h-3 w-8 bg-gray-300 rounded" />
          <div className="h-3 w-10 bg-gray-300 rounded" />
          <div className="h-3 w-8 bg-gray-300 rounded" />
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2">
          <div className="w-6 h-6 rounded-full bg-gray-300" />
          <div className="h-3 w-20 bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}
