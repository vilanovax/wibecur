import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="پروفایل" />
      <main className="px-4 py-5 space-y-5">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 text-center space-y-1">
                <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mx-auto" />
                <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>

        {/* List cards */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/60 p-5">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
