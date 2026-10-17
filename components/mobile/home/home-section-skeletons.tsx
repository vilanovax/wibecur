import { Skeleton } from '@/components/ui/skeleton';

export function HomeFeedSectionSkeleton({ titleWidth = 'w-36' }: { titleWidth?: string }) {
  return (
    <section className="mb-6 min-h-48 lg:min-h-56" aria-hidden>
      <div className="mb-3 px-4 lg:px-0">
        <Skeleton className={`h-6 ${titleWidth}`} />
      </div>
      <div className="px-4 lg:px-0">
        <Skeleton className="h-28 w-full rounded-xl lg:h-36" />
      </div>
    </section>
  );
}
