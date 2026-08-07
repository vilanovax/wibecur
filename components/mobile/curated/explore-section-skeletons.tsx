export function ExploreSurpriseSectionSkeleton() {
  return (
    <section className="px-2.5 py-3 lg:px-0 lg:py-4" aria-hidden>
      <div className="h-[7.5rem] animate-pulse rounded-3xl bg-gray-100 lg:mx-auto lg:max-w-2xl lg:h-[8.5rem]" />
    </section>
  );
}

export function ExploreTrendingSectionSkeleton() {
  return (
    <section className="px-2.5 py-4 lg:px-0 lg:py-5" aria-hidden>
      <div className="mb-2.5 h-5 w-44 animate-pulse rounded bg-gray-200" />
      <div className="mb-1 h-3 w-36 animate-pulse rounded bg-gray-100" />
      <div className="mt-3 flex gap-3 overflow-hidden">
        <div className="h-[180px] w-[78%] max-w-[280px] shrink-0 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-[180px] w-[46%] shrink-0 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </section>
  );
}

export function ExploreCategorySectionSkeleton() {
  return (
    <section className="px-2.5 py-4 lg:px-0 lg:py-5" aria-hidden>
      <div className="mb-2.5 h-5 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mb-1 h-3 w-52 animate-pulse rounded bg-gray-100" />
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    </section>
  );
}

export function ExploreForYouSectionSkeleton() {
  return (
    <section className="border-t border-wibe/60 px-2.5 py-4 lg:px-0 lg:py-5" aria-hidden>
      <div className="mb-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-row-reverse gap-2.5 rounded-xl border border-wibe p-2.5">
            <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-lg bg-gray-200" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
