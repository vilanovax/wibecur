import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** اسکلت پروفایل — هدر، تب‌ها و ردیف لیست، پیش از رسیدن داده. */
export default function ProfilePageContentSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-4 w-28" />
      <Card className="bg-popover p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </Card>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
