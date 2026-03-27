import BottomNav from '@/components/mobile/layout/BottomNav';

export default function ItemDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero image skeleton */}
      <div className="relative h-72 bg-gray-200 animate-pulse" />

      <div className="px-4 mt-4 space-y-6">
        {/* Title + meta */}
        <div>
          <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/2 mt-2 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          ))}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Comments skeleton */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
