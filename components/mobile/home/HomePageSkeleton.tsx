/** Fallback while home payload streams — mirrors desktop/mobile first viewport to limit CLS. */
export function HomePageSkeleton() {
  return (
    <div className="flex flex-col" dir="rtl" aria-busy aria-label="در حال بارگذاری خانه">
      {/* Mobile sticky search (matches HomeResponsiveContent) */}
      <div className="sticky top-14 z-10 border-b border-wibe/50 bg-wibe-surface/95 px-4 pb-1.5 pt-0.5 lg:hidden">
        <div className="h-11 animate-pulse rounded-xl bg-wibe-surface" />
      </div>

      {/* Mobile first viewport — chips then hero (matches HomeMobileView) */}
      <div className="lg:hidden">
        <div className="flex gap-2 px-4 py-2 pb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-lg bg-wibe-surface" />
          ))}
        </div>
        <div className="px-4 pt-0.5">
          <div className="h-[220px] animate-pulse rounded-2xl bg-wibe-surface sm:h-[230px]" />
          <div className="mt-4 mb-3 flex gap-2">
            <div className="h-9 w-20 animate-pulse rounded-full bg-wibe-surface" />
            <div className="h-9 w-24 animate-pulse rounded-full bg-wibe-surface" />
          </div>
          <div className="mb-3 h-5 w-36 animate-pulse rounded bg-wibe-surface" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[183px] w-[160px] shrink-0 animate-pulse rounded-xl bg-wibe-surface"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop — matches HomeDesktopView: chips → mood|hero → trending → for-you reserve */}
      <div className="hidden flex-col gap-6 px-5 pt-3 lg:flex xl:gap-7">
        <div className="flex gap-2 border-b border-wibe/60 pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-28 animate-pulse rounded-full bg-wibe-surface" />
          ))}
        </div>

        <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.55fr)] xl:items-stretch xl:gap-5">
          <div className="order-2 flex min-h-[20rem] flex-col gap-3 xl:order-1">
            <div className="h-6 w-40 animate-pulse rounded bg-wibe-surface" />
            <div className="h-3 w-48 animate-pulse rounded bg-wibe-surface" />
            <div className="flex flex-1 flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-wibe-surface" />
              ))}
            </div>
          </div>
          <div className="order-1 xl:order-2">
            <div className="h-[21rem] animate-pulse rounded-[1.35rem] bg-wibe-surface xl:h-[22.5rem]" />
          </div>
        </div>

        <div>
          <div className="mb-3 h-6 w-36 animate-pulse rounded bg-wibe-surface" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-wibe-surface" />
            ))}
          </div>
        </div>

        {/* Reserve ForYou / deferred personal block */}
        <div className="min-h-[12rem]">
          <div className="mb-3 h-6 w-32 animate-pulse rounded bg-wibe-surface" />
          <div className="h-36 animate-pulse rounded-xl bg-wibe-surface" />
        </div>
      </div>
    </div>
  );
}
