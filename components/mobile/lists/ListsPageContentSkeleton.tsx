import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** اسکلت داخل صفحهٔ لیست‌ها؛ هدر و نوار پایین بیرون از Suspense هستند. */
export default function ListsPageContentSkeleton() {
  return (
    <div className="w-full min-w-0 space-y-0 pb-6 lg:pb-4" aria-hidden>
      <div className="mb-2 max-lg:px-4 lg:mb-3">
        <Skeleton className="h-4 w-28" />
      </div>
      <h1 className="mb-2 hidden text-lg font-bold text-foreground lg:block">لیست‌ها</h1>

      <div className="pb-2 pt-1 max-lg:px-4 lg:px-0 lg:pb-2 lg:pt-0">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      <div className="sticky top-14 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex gap-2 overflow-hidden px-3 py-2 lg:px-0">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 lg:px-0">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="hidden h-11 w-20 rounded-xl sm:block" />
        </div>
      </div>

      <div className="mt-2 w-full min-w-0 max-lg:px-3 lg:mt-4 lg:px-0">
        <section className="mb-3 lg:mb-5">
          <Skeleton className="mb-2 h-6 w-20" />
          <Skeleton className="aspect-video min-h-28 w-full rounded-xl lg:min-h-44" />
        </section>

        <section className="mb-4 lg:mb-6">
          <Skeleton className="mb-3 h-6 w-36 lg:mb-4" />
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className={`overflow-hidden bg-popover p-0 ${i > 4 ? 'max-lg:hidden' : ''}`}
              >
                <Skeleton className="aspect-[5/4] w-full rounded-none lg:aspect-video" />
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
