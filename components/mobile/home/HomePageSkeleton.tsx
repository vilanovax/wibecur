import { Skeleton } from '@/components/ui/skeleton';

/** اسکلت خانه تا رسیدن داده؛ شکل نوار جستجو، چیپ‌ها و هیرو را نگه می‌دارد. */
export function HomePageSkeleton() {
  return (
    <div className="flex flex-col bg-background" aria-busy aria-label="در حال بارگذاری خانه">
      <div className="sticky top-14 z-10 border-b border-border bg-background/95 px-4 py-2 lg:hidden">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      <div className="lg:hidden">
        <div className="flex gap-2 px-4 py-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-11 w-28 shrink-0 rounded-xl" />
          ))}
        </div>
        <div className="px-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <div className="mb-3 mt-4 flex gap-2">
            <Skeleton className="h-11 w-20 rounded-full" />
            <Skeleton className="h-11 w-24 rounded-full" />
          </div>
          <Skeleton className="mb-3 h-5 w-36" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-40 shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden flex-col gap-6 px-5 pt-3 lg:flex">
        <div className="flex gap-2 border-b border-border pb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 w-28 rounded-full" />
          ))}
        </div>

        <div className="flex flex-col gap-6 xl:grid xl:grid-cols-2 xl:items-stretch">
          <div className="order-2 flex min-h-80 flex-col gap-3 xl:order-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-48" />
            <div className="flex flex-1 flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="order-1 xl:order-2">
            <Skeleton className="h-80 w-full rounded-xl xl:h-96" />
          </div>
        </div>

        <div>
          <Skeleton className="mb-3 h-6 w-36" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="min-h-48">
          <Skeleton className="mb-3 h-6 w-32" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
