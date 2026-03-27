import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function PublicProfileLoading() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <Header title="" />
      <div className="px-4 pt-6 space-y-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Lists grid skeleton */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
              <div className="p-3 space-y-2 bg-gray-50">
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
