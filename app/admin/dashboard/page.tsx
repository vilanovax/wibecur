import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { getDashboardData } from '@/lib/admin/dashboard-data';
import DashboardContent from '@/components/admin/dashboard/DashboardContent';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-[72px] bg-[var(--color-border-muted)] rounded-[16px]" />
      <div className="grid grid-cols-12 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="col-span-12 sm:col-span-6 xl:col-span-4 2xl:col-span-2 h-28 bg-[var(--color-border-muted)] rounded-[16px]" />
        ))}
        <div className="col-span-12 lg:col-span-8 h-80 bg-[var(--color-border-muted)] rounded-[16px]" />
        <div className="col-span-12 lg:col-span-4 h-80 bg-[var(--color-border-muted)] rounded-[16px]" />
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getDashboardData();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent data={data} />
    </Suspense>
  );
}
