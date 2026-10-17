import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ExploreSurpriseSectionSkeleton() {
  return (
    <section className="px-3 py-3 lg:px-0 lg:py-4" aria-hidden>
      <Skeleton className="mx-auto h-32 w-full rounded-xl lg:h-36 lg:max-w-2xl" />
    </section>
  );
}

export function ExploreTrendingSectionSkeleton() {
  return (
    <section className="px-3 py-4 lg:px-0 lg:py-5" aria-hidden>
      <Skeleton className="mb-2 h-5 w-44" />
      <Skeleton className="mb-1 h-3 w-36" />
      <div className="mt-3 flex gap-3 overflow-hidden">
        <Skeleton className="h-44 w-4/5 max-w-72 shrink-0 rounded-xl" />
        <Skeleton className="h-44 w-1/2 shrink-0 rounded-xl" />
      </div>
    </section>
  );
}

export function ExploreCategorySectionSkeleton() {
  return (
    <section className="px-3 py-4 lg:px-0 lg:py-5" aria-hidden>
      <Skeleton className="mb-2 h-5 w-40" />
      <Skeleton className="mb-1 h-3 w-52" />
      <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export function ExploreForYouSectionSkeleton() {
  return (
    <section className="border-t border-border px-3 py-4 lg:px-0 lg:py-5" aria-hidden>
      <Skeleton className="mb-3 h-5 w-32" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Card key={i} className="flex gap-3 bg-popover p-3">
            <Skeleton className="size-16 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
