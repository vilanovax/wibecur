import { Skeleton } from '@/components/ui/skeleton';

export function CategoryTrendingSectionSkeleton() {
  return (
    <section className="py-5 lg:py-6" aria-hidden>
      <Skeleton className="mb-3 h-6 w-48 lg:mb-4" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export function CategorySectionSkeleton() {
  return (
    <section className="py-5 lg:py-6" aria-hidden>
      <Skeleton className="mb-3 h-6 w-40" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </section>
  );
}
