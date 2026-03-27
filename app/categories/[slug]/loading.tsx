import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="" showBack />
      <div className="px-4 pt-4 space-y-4">
        {/* Genre chips skeleton */}
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
              <div className="p-3 space-y-2 bg-white">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
