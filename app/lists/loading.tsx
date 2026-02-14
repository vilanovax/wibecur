import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[20px] overflow-hidden shadow-vibe-card border border-gray-100">
      <div className="aspect-[4/3] w-full bg-gray-200 animate-pulse" />
      <div className="p-4">
        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-1/2 mt-2 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-2 mt-3">
          <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ListsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="لیست‌ها" />
      <main className="pt-3">
        <div className="space-y-0 pb-8">
          <div className="sticky top-14 z-10 bg-gray-50 pt-3 pb-2">
            <div className="px-4">
              <div className="h-12 bg-gray-200 rounded-[16px] animate-pulse" />
            </div>
            <div className="mt-3 px-4 flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-16 bg-gray-200 rounded animate-pulse flex-shrink-0" />
              ))}
            </div>
            <div className="mt-2 px-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-20 bg-gray-100 rounded-[20px] animate-pulse flex-shrink-0" />
              ))}
            </div>
            <div className="mt-3 px-4 flex justify-between">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="mt-4 px-4 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
