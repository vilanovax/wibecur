import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ExplorePageSkeleton() {
  return (
    <div className="bg-background">
      <div className="border-b border-border px-3 pb-3 pt-2">
        <Skeleton className="mb-2 h-6 w-40" />
        <Skeleton className="mb-2 h-12 w-full rounded-xl" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <div className="px-3 py-4">
        <Skeleton className="mb-2 h-5 w-28" />
        <Skeleton className="mb-1 h-3 w-44" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-3 h-11 w-full rounded-xl" />
      </div>

      <div className="px-3 py-4">
        <Skeleton className="mb-3 h-5 w-36" />
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-44 w-4/5 max-w-72 shrink-0 rounded-xl" />
          <Skeleton className="h-44 w-3/5 shrink-0 rounded-xl" />
        </div>
      </div>

      <div className="border-t border-border px-3 py-4">
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
      </div>

      <div className="border-t border-border px-3 py-4">
        <Skeleton className="mb-3 h-5 w-36" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden bg-popover p-0">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="p-2">
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
