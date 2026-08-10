import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';

/**
 * اسکلتون نزدیک به چیدمان واقعی (دسکتاپ ۴ ستون + منتخب) تا CLS تعویض loading→page کم شود.
 */
export default function ListsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-wibe-card">
      <Header title="لیست‌ها" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <main className="min-w-0 flex-1 pt-2 lg:pt-0">
        <div className="w-full min-w-0 space-y-0 pb-6 lg:pb-4">
          <div className="mb-2 max-lg:px-4 lg:mb-3">
            <div className="h-4 w-28 animate-pulse rounded bg-wibe-surface" />
          </div>
          <h1 className="mb-2 hidden wibe-h3 font-bold text-foreground lg:block">لیست‌ها</h1>

          <div className="pb-2 pt-1 max-lg:px-4 lg:pb-2 lg:pt-0 lg:px-0">
            <div className="h-10 animate-pulse rounded-xl bg-wibe-surface lg:h-9" />
          </div>

          <div className="sticky top-14 z-20 border-b border-wibe bg-wibe-card/95 backdrop-blur-md">
            <div className="flex gap-1.5 overflow-hidden px-3 py-2 lg:px-0">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-wibe-surface" />
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 lg:px-0">
              <div className="h-8 flex-1 animate-pulse rounded-lg bg-wibe-surface" />
              <div className="hidden h-8 w-20 animate-pulse rounded-lg bg-wibe-surface sm:block" />
            </div>
          </div>

          <div className="mt-2 w-full min-w-0 max-lg:px-3 lg:mt-4 lg:px-0">
            {/* منتخب */}
            <section className="mb-3 lg:mb-5" aria-hidden>
              <div className="mb-2 h-6 w-20 animate-pulse rounded bg-wibe-surface" />
              <div className="aspect-[2/1] min-h-[108px] w-full animate-pulse rounded-xl bg-wibe-surface sm:aspect-[5/3] sm:min-h-[128px] lg:aspect-[3/2] lg:min-h-[180px] xl:min-h-[200px]" />
            </section>

            {/* سکشن دسته */}
            <section className="mb-4 lg:mb-6" aria-hidden>
              <div className="mb-3 h-6 w-36 animate-pulse rounded bg-wibe-surface lg:mb-4" />
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] lg:gap-3 xl:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] xl:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className={`overflow-hidden rounded-xl border border-wibe bg-wibe-card ${
                      i > 4 ? 'max-lg:hidden' : ''
                    }`}
                  >
                    <div className="aspect-[5/4] w-full animate-pulse bg-wibe-surface lg:aspect-[16/10]" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
