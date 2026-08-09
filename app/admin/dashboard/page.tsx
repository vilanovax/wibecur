import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { requireAdmin } from '@/lib/auth';
import { getCachedDashboardData } from '@/lib/admin/dashboard-data-cached';
import { parseDashboardRange } from '@/lib/admin/dashboard-range';

const DashboardContent = nextDynamic(
  () => import('@/components/admin/dashboard/DashboardContent'),
  {
    loading: () => <DashboardSkeleton />,
  }
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-[72px] bg-[var(--color-border-muted)] rounded-[16px]" />
      <div className="grid grid-cols-12 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="col-span-12 sm:col-span-6 xl:col-span-4 2xl:col-span-2 h-28 bg-[var(--color-border-muted)] rounded-[16px]"
          />
        ))}
        <div className="col-span-12 lg:col-span-8 h-80 bg-[var(--color-border-muted)] rounded-[16px]" />
        <div className="col-span-12 lg:col-span-4 h-80 bg-[var(--color-border-muted)] rounded-[16px]" />
      </div>
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdmin();
  const { range: rangeParam } = await searchParams;
  const range = parseDashboardRange(rangeParam);
  const data = await getCachedDashboardData(range);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent data={data} />
    </Suspense>
  );
}
