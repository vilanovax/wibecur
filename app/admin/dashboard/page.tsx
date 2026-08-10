import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { getCachedDashboardData } from '@/lib/admin/dashboard-data-cached';
import { parseDashboardRange } from '@/lib/admin/dashboard-range';
import { toDashboardClientPayload } from '@/lib/admin/types';
import DashboardContent from '@/components/admin/dashboard/DashboardContent';

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

/**
 * Data loader streams behind Suspense so the admin shell can paint
 * while dashboard queries run (async-suspense-boundaries).
 */
async function DashboardDataSection({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range = parseDashboardRange(rangeParam);
  const data = await getCachedDashboardData(range);
  // Trim RSC → client serialization to fields the UI actually reads
  return <DashboardContent data={toDashboardClientPayload(data)} />;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  // Cheap auth gate before streaming body (async-cheap-condition-before-await)
  await requireAdmin();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataSection searchParams={searchParams} />
    </Suspense>
  );
}
