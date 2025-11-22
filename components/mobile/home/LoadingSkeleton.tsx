'use client';

export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Hero Skeleton */}
      <div className="px-4">
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
      </div>

      {/* Cards Skeleton */}
      <div className="px-4">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <div className="h-40 bg-gray-200 rounded-2xl mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Skeleton */}
      <div className="px-4">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 w-28">
              <div className="h-28 bg-gray-200 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Lists Skeleton */}
      <div className="px-4 space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );
}

