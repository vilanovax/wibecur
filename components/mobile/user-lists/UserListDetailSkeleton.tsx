import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserListDetailSkeleton() {
  return (
    <main className="min-h-[100dvh] space-y-6 bg-background">
      <Skeleton className="h-40 w-full rounded-none sm:h-48" />
      <div className="space-y-3 px-4">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="space-y-3 px-4">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-11 w-28 rounded-xl" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex gap-3 bg-popover p-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <Skeleton className="size-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
