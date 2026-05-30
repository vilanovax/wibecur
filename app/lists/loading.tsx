import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

function GridCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-wibe bg-wibe-card">
      <div className="h-28 w-full animate-pulse bg-gray-200" />
    </div>
  );
}

export default function ListsLoading() {
  return (
    <div className="min-h-screen bg-wibe-surface pb-20">
      <Header title="لیست‌ها" />
      <main className="pt-3">
        <div className="space-y-0 pb-8">
          <div className="sticky top-14 z-10 border-b border-wibe bg-wibe-surface/95 pb-2 pt-1.5">
            <div className="px-2.5">
              <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
            </div>
            <div className="mt-2 flex gap-2 px-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-14 shrink-0 animate-pulse rounded-md bg-gray-200" />
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-5 px-2.5">
            <div>
              <div className="mb-2.5 h-6 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-[148px] animate-pulse rounded-xl bg-gray-200" />
            </div>
            <div>
              <div className="mb-2.5 h-6 w-32 animate-pulse rounded bg-gray-200" />
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <GridCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
