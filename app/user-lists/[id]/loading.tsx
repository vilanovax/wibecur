import BottomNav from '@/components/mobile/layout/BottomNav';

export default function UserListDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
        </div>
      </div>

      {/* Cover image */}
      <div className="h-64 bg-gray-200 animate-pulse" />

      <div className="px-4 mt-4 space-y-4">
        {/* Category chip */}
        <div className="h-9 w-28 bg-gray-200 rounded-full animate-pulse" />

        {/* Title */}
        <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />

        {/* Stats */}
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>

        {/* Items */}
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
